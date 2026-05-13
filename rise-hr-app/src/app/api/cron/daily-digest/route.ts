import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/mailer'
import { getTeamMembers } from '@/lib/airtable'
import { isSunday, format } from 'date-fns'
import { INDIA_HOLIDAYS_2026 } from '@/lib/utils'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  // Skip on Sundays or holidays
  if (isSunday(today) || INDIA_HOLIDAYS_2026.includes(todayStr)) {
    return NextResponse.json({ message: 'Skipped: Sunday or Holiday' })
  }

  const { data: leaves } = await supabaseAdmin
    .from('leave_requests')
    .select('employee_name, type, end_date')
    .eq('status', 'approved')
    .lte('start_date', todayStr)
    .gte('end_date', todayStr)

  const team = await getTeamMembers()
  const teamEmails = team.map(m => m.email).filter(Boolean)

  if (!teamEmails.length) {
    return NextResponse.json({ error: 'No team members found' }, { status: 500 })
  }

  if (!leaves || leaves.length === 0) {
    await sendEmail({
      to: teamEmails,
      subject: `🌿 Who's out today — ${format(today, 'EEEE, dd MMM yyyy')}`,
      html: `<div style="font-family: sans-serif; color: #1a1a1a;"><p>✅ Everyone is in the office today!</p></div>`,
    })
    return NextResponse.json({ message: 'Sent empty digest' })
  }

  const pto: string[] = []
  const wfh: string[] = []

  leaves.forEach(l => {
    if (l.type === 'wfh') wfh.push(l.employee_name)
    else pto.push(l.employee_name)
  })

  // Returning tomorrow (leave ends today)
  const returning = leaves.filter(l => l.end_date === todayStr).map(l => l.employee_name)

  let body = `<div style="font-family: sans-serif; color: #1a1a1a; line-height: 1.6;">`
  body += `<h2 style="margin-bottom: 16px;">Who's out — ${format(today, 'EEEE, dd MMM yyyy')}</h2>`

  if (pto.length > 0) {
    body += `<h3 style="color: #2563eb; margin-bottom: 8px;">🏖 Out of Office (PTO / Sick / Planned)</h3><ul style="margin-bottom: 16px;">${pto.map(n => `<li>${n}</li>`).join('')}</ul>`
  }
  if (wfh.length > 0) {
    body += `<h3 style="color: #059669; margin-bottom: 8px;">🏠 Working from Home</h3><ul style="margin-bottom: 16px;">${wfh.map(n => `<li>${n}</li>`).join('')}</ul>`
  }
  if (returning.length > 0) {
    body += `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />`
    body += `<p style="color: #6b7280; font-size: 14px;">🔔 <strong>Returning tomorrow:</strong> ${returning.join(', ')}</p>`
  }

  body += `</div>`

  await sendEmail({
    to: teamEmails,
    subject: `🌿 Who's out today — ${format(today, 'EEEE, dd MMM yyyy')}`,
    html: body,
  })

  return NextResponse.json({
    message: 'Sent daily digest',
    ptoCount: pto.length,
    wfhCount: wfh.length,
    returningCount: returning.length,
  })
}
