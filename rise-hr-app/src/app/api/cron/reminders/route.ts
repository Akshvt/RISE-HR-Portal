import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/mailer'
import { getTeamMembers } from '@/lib/airtable'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const { data: pendingLeaves } = await supabaseAdmin
    .from('leave_requests')
    .select('id, employee_name, leave_type, start_date, created_at')
    .eq('status', 'pending')
    .lte('created_at', fortyEightHoursAgo)

  if (!pendingLeaves || pendingLeaves.length === 0) {
    return NextResponse.json({ message: 'No stale pending requests.' })
  }

  const team = await getTeamMembers()
  const admins = team.filter(m => m.role === 'Admin').map(m => m.email)

  if (admins.length > 0) {
    let body = `<h3>Pending Leave Requests (Over 48 hours)</h3><ul>`
    pendingLeaves.forEach(l => {
      body += `<li><strong>${l.employee_name}</strong> - ${l.leave_type} starting on ${l.start_date}</li>`
    })
    body += `</ul><p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/calendar">Review in Portal</a></p>`

    await sendEmail({
      to: admins,
      subject: `Reminder: ${pendingLeaves.length} Leave Requests Awaiting Approval`,
      html: body,
    })
  }

  return NextResponse.json({ message: 'Sent reminders', count: pendingLeaves.length })
}
