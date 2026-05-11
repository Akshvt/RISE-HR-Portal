import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateDeduction, INDIA_HOLIDAYS_2026 } from '@/lib/utils'
import { parseISO, differenceInDays } from 'date-fns'
import { sendEmail } from '@/lib/mailer'
import { getTeamMembers } from '@/lib/airtable'

// Map our UI leave type values → DB type column values
// DB expects: 'full_day' | 'half_day_am' | 'half_day_pm' | 'sick' | 'planned' | 'wfh'
function toDbType(leaveType: string, halfSession?: string): string {
  if (leaveType === 'full') return 'full_day'
  if (leaveType === 'half') return halfSession === 'PM' ? 'half_day_pm' : 'half_day_am'
  // sick, planned, wfh — same in DB
  return leaveType
}

// Map DB type values → our UI leave type (for balance buckets)
function isWfh(dbType: string) { return dbType === 'wfh' }

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const email = session.user.email!
  const isAdmin = ['Admin', 'HR'].includes(session.user.role ?? '')

  let query = supabaseAdmin
    .from('leave_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (!isAdmin) {
    query = query.eq('employee_email', email)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { leaveType, startDate, endDate, halfSession, reason } = body

  if (!leaveType || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required fields: leaveType, startDate, endDate' }, { status: 400 })
  }

  const email = session.user.email!
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  const now = new Date()
  const isAdmin = ['Admin', 'HR'].includes(session.user.role ?? '')

  if (!isAdmin && differenceInDays(now, start) > 7) {
    return NextResponse.json({ error: 'Cannot apply leave more than 7 days in the past' }, { status: 400 })
  }

  const kind: 'half' | 'full' = leaveType === 'half' ? 'half' : 'full'
  const daysDeducted = calculateDeduction(start, end, kind, INDIA_HOLIDAYS_2026)

  // Overlap check
  const { data: overlapping } = await supabaseAdmin
    .from('leave_requests')
    .select('id')
    .eq('employee_email', email)
    .eq('status', 'approved')
    .lte('start_date', endDate)
    .gte('end_date', startDate)
    .limit(1)

  if (overlapping && overlapping.length > 0) {
    return NextResponse.json({ error: 'This overlaps with an existing approved leave' }, { status: 400 })
  }

  const airtableId = (session.user as any).airtableId || email

  // Balance check via leave_balances table
  const year = start.getFullYear()
  const { data: balance } = await supabaseAdmin
    .from('leave_balances')
    .select('pto_taken, wfh_taken')
    .eq('employee_airtable_id', airtableId)
    .eq('year', year)
    .single()

  const ptoTaken = Number(balance?.pto_taken ?? 0)
  const wfhTaken = Number(balance?.wfh_taken ?? 0)
  const currentBucket = leaveType === 'wfh' ? wfhTaken : ptoTaken

  if (currentBucket + daysDeducted > 20) {
    return NextResponse.json({
      error: `Insufficient ${leaveType === 'wfh' ? 'WFH' : 'PTO'} balance. Used: ${currentBucket}, Requesting: ${daysDeducted}, Limit: 20`
    }, { status: 400 })
  }

  // Sick leave auto-approved
  const status = leaveType === 'sick' ? 'approved' : 'pending'
  const dbType = toDbType(leaveType, halfSession)

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('leave_requests')
    .insert({
      employee_email: email,
      employee_name: session.user.name,
      employee_airtable_id: airtableId,
      type: dbType,
      start_date: startDate,
      end_date: endDate,
      reason: reason?.trim() || null,
      days_deducted: daysDeducted,
      status,
    })
    .select()
    .single()

  if (insertError) {
    console.error('[Leave POST] Insert failed:', JSON.stringify(insertError, null, 2))
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Update leave_balances table
  const balanceField = leaveType === 'wfh' ? 'wfh_taken' : 'pto_taken'
  const newValue = (leaveType === 'wfh' ? wfhTaken : ptoTaken) + daysDeducted

  await supabaseAdmin
    .from('leave_balances')
    .upsert({
      employee_airtable_id: airtableId,
      year,
      [balanceField]: newValue,
    }, { onConflict: 'employee_airtable_id,year' })

  // Audit log
  await supabaseAdmin.from('audit_log').insert({
    actor_airtable_id: airtableId,
    actor_name: session.user.name ?? '',
    actor_role: (session.user as any).role ?? 'Member',
    action_type: 'leave_submitted',
    target: inserted.id,
    after_json: { type: dbType, startDate, endDate, daysDeducted, status },
  })

  // Email admins/HR
  try {
    const team = await getTeamMembers()
    const adminEmails = team
      .filter(m => ['Admin', 'HR'].includes(m.role))
      .map(m => m.email)
      .filter(Boolean)

    if (adminEmails.length > 0) {
      const subject = leaveType === 'sick'
        ? `FYI: Sick Leave Auto-Approved — ${session.user.name}`
        : `Action Required: Leave Request from ${session.user.name}`

      const html = leaveType === 'sick'
        ? `<p><strong>${session.user.name}</strong> has logged a sick day from <strong>${startDate}</strong> to <strong>${endDate}</strong>.</p><p>Reason: ${reason || 'N/A'}</p>`
        : `<p><strong>${session.user.name}</strong> has requested <strong>${dbType.replace('_', ' ')}</strong> leave from <strong>${startDate}</strong> to <strong>${endDate}</strong>.</p>
           <p>Reason: ${reason || 'N/A'}</p>
           <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/team-leaves">Review in Portal →</a></p>`

      await sendEmail({ to: adminEmails, subject, html })
    }

    // Email the employee confirming their submission
    await sendEmail({
      to: email,
      subject: `Leave Request Submitted: ${dbType.replace('_', ' ')}`,
      html: `<p>Hi ${session.user.name},</p>
             <p>Your request for <strong>${dbType.replace('_', ' ')}</strong> leave from <strong>${startDate}</strong> to <strong>${endDate}</strong> has been successfully submitted and is pending approval.</p>
             <p>You can check the status on your My Leaves page.</p>`
    })
  } catch (emailErr) {
    console.error('[Leave POST] Email notification failed:', emailErr)
  }

  return NextResponse.json(inserted, { status: 201 })
}
