import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'

function dbTypeLabel(type: string): string {
  const map: Record<string, string> = {
    full_day: 'Full Day', half_day_am: 'Half Day AM', half_day_pm: 'Half Day PM',
    sick: 'Sick Day', planned: 'Planned', wfh: 'WFH',
  }
  return map[type] ?? type
}

export async function GET() {
  const session = await auth()
  if (!['Admin', 'HR'].includes(session?.user?.role ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: requests, error } = await supabaseAdmin
    .from('leave_requests')
    .select('employee_email, employee_name, type, start_date, end_date, days_deducted, status, reason, rejection_reason, approved_by')
    .eq('status', 'approved')
    .order('start_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!requests || requests.length === 0) {
    return NextResponse.json({ error: 'No approved leave data to export' }, { status: 404 })
  }

  const headers = ['Employee Name', 'Email', 'Leave Type', 'Start Date', 'End Date', 'Days Deducted', 'Status', 'Reason', 'Approved By']
  const rows = requests.map(r => [
    r.employee_name ?? '',
    r.employee_email ?? '',
    dbTypeLabel(r.type ?? ''),
    r.start_date ?? '',
    r.end_date ?? '',
    r.days_deducted ?? '',
    r.status ?? '',
    r.reason ?? '',
    r.approved_by ?? '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=leave_report_${new Date().toISOString().slice(0, 10)}.csv`,
    },
  })
}
