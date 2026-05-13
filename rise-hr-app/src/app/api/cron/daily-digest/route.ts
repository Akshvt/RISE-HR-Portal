import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/mailer'
import { getTeamMembers } from '@/lib/airtable'
import { isSunday, format, parseISO, differenceInYears, addDays } from 'date-fns'
import { INDIA_HOLIDAYS_2026 } from '@/lib/utils'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const todayMMDD = format(today, 'MM-dd')

  // 1. SKIP CHECKS (Verified)
  if (isSunday(today) || INDIA_HOLIDAYS_2026.includes(todayStr)) {
    return NextResponse.json({ message: 'Skipped: Sunday or Holiday' })
  }

  // 2. FETCH DATA (Verified)
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

  // 3. CELEBRATIONS LOGIC (New)
  const birthdays: string[] = []
  const anniversaries: { name: string; years: number }[] = []

  team.forEach(member => {
    if (member.dob && member.dob.substring(5) === todayMMDD) {
      birthdays.push(member.name)
    }
    if (member.joinDate && member.joinDate.substring(5) === todayMMDD) {
      const years = differenceInYears(today, parseISO(member.joinDate))
      if (years > 0) anniversaries.push({ name: member.name, years })
    }
  })

  // 4. LEAVE LOGIC
  const pto: string[] = []
  const wfh: string[] = []
  leaves?.forEach(l => {
    if (l.type === 'wfh') wfh.push(l.employee_name)
    else pto.push(l.employee_name)
  })

  let nextWorkingDay = addDays(today, 1)
  while (isSunday(nextWorkingDay) || INDIA_HOLIDAYS_2026.includes(format(nextWorkingDay, 'yyyy-MM-dd'))) {
    nextWorkingDay = addDays(nextWorkingDay, 1)
  }
  const nextWorkingDayStr = format(nextWorkingDay, 'yyyy-MM-dd')

  const { data: nextLeaves } = await supabaseAdmin
    .from('leave_requests')
    .select('employee_name')
    .eq('status', 'approved')
    .lte('start_date', nextWorkingDayStr)
    .gte('end_date', nextWorkingDayStr)

  const nextLeavesNames = new Set(nextLeaves?.map(l => l.employee_name) || [])

  const returning = (leaves || [])
    .filter(l => l.end_date === todayStr && !nextLeavesNames.has(l.employee_name))
    .map(l => l.employee_name)

  // 5. EMAIL COMPOSITION
  let body = `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a2e24; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">`
  
  // Header
  body += `<div style="background: #1C7C54; padding: 24px; color: white; text-align: center;">`
  body += `<h1 style="margin: 0; font-size: 22px; font-weight: 700;">🌿 Daily Digest</h1>`
  body += `<p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">${format(today, 'EEEE, dd MMMM yyyy')}</p>`
  body += `</div>`

  body += `<div style="padding: 24px; background: #FBF8EF;">`

  // Section: Celebrations
  if (birthdays.length > 0 || anniversaries.length > 0) {
    body += `<div style="background: #F5FDE5; border: 1px solid #1C7C54; border-radius: 12px; padding: 16px; margin-bottom: 24px;">`
    body += `<h3 style="margin: 0 0 12px; color: #1C7C54; font-size: 16px;">🎉 Today's Celebrations</h3>`
    
    birthdays.forEach(name => {
      body += `<p style="margin: 4px 0; font-size: 15px;">🎂 <strong>Happy Birthday, ${name}!</strong></p>`
    })
    
    anniversaries.forEach(a => {
      body += `<p style="margin: 4px 0; font-size: 15px;">✨ <strong>Congratulations ${a.name}!</strong> celebrating ${a.years} ${a.years === 1 ? 'year' : 'years'} at RISE Research.</p>`
    })
    
    body += `</div>`
  }

  // Section: Who's Out
  body += `<h3 style="margin: 0 0 12px; color: #2D4A3E; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">📋 Status Today</h3>`

  if (pto.length === 0 && wfh.length === 0) {
    body += `<p style="color: #1C7C54; font-weight: 600; background: #f0fdf4; padding: 12px; border-radius: 8px; text-align: center;">✅ Everyone is in the office today!</p>`
  } else {
    if (pto.length > 0) {
      body += `<div style="margin-bottom: 16px;"><p style="color: #991B1B; font-weight: 700; margin: 0 0 4px; font-size: 13px; text-transform: uppercase;">🏖 Out of Office</p>`
      body += `<p style="margin: 0; font-size: 15px;">${pto.join(', ')}</p></div>`
    }
    if (wfh.length > 0) {
      body += `<div style="margin-bottom: 16px;"><p style="color: #1C7C54; font-weight: 700; margin: 0 0 4px; font-size: 13px; text-transform: uppercase;">🏠 Working from Home</p>`
      body += `<p style="margin: 0; font-size: 15px;">${wfh.join(', ')}</p></div>`
    }
  }

  // Section: Returning
  if (returning.length > 0) {
    body += `<div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #e2e8f0;">`
    body += `<p style="color: #64748b; font-size: 13px; margin: 0;">🔔 <strong>Returning on ${format(nextWorkingDay, 'EEEE')}:</strong> ${returning.join(', ')}</p>`
    body += `</div>`
  }

  body += `</div>` // Content padding
  body += `<div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">`
  body += `Sent automatically by RISE HR Portal • People. Purpose. Progress.`
  body += `</div></div>`

  await sendEmail({
    to: teamEmails,
    subject: `🌿 Daily Digest — ${format(today, 'dd MMM')}`,
    html: body,
  })

  return NextResponse.json({
    message: 'Sent daily digest',
    birthdays: birthdays.length,
    anniversaries: anniversaries.length,
    ptoCount: pto.length,
    wfhCount: wfh.length,
  })
}
