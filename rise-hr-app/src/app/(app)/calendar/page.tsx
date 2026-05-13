import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { TopBar } from '@/components/TopBar'
import { CalendarGrid } from '@/components/CalendarGrid'
import holidaysData from '@/lib/holidays.json'
import { getTeamMembers } from '@/lib/airtable'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const session = await auth()
  const isAdmin = ['Admin', 'HR'].includes(session?.user?.role ?? '')
  const userId = session?.user?.email

  const { data: events } = await supabaseAdmin
    .from('leave_requests')
    .select('id, employee_name, type, start_date, end_date, status, reason, employee_email')
    .in('status', ['approved', 'pending'])
    .order('start_date', { ascending: true })

  // Non-admins only see their own pending; everyone sees approved
  const filtered = (events || []).filter((e: any) =>
    e.status === 'approved' ||
    (e.status === 'pending' && (isAdmin || e.employee_email === userId))
  )

  const mapped = filtered.map((e: any) => ({
    id: e.id,
    employee: e.employee_name,
    type: e.type,           // DB type: full_day, half_day_am, wfh, etc.
    startDate: e.start_date,
    endDate: e.end_date,
    status: e.status as 'approved' | 'pending' | 'rejected',
    reason: e.reason,
  }))

  const holidayEvents = holidaysData.map(h => ({
    id: h.id,
    employee: h.name,
    type: 'holiday',
    startDate: h.date,
    endDate: h.date,
    status: 'approved' as const,
  }))

  const team = await getTeamMembers()
  const currentYear = 2026

  const bdays = team.filter(m => m.dob).map(m => ({
    id: `bday-${m.id}`,
    employee: `${m.name} 🎂`,
    type: 'birthday',
    startDate: m.dob!.replace(/^\d{4}/, currentYear.toString()),
    endDate: m.dob!.replace(/^\d{4}/, currentYear.toString()),
    status: 'approved' as const,
  }))

  const workAnnis = team.filter(m => m.joinDate).map(m => ({
    id: `anni-${m.id}`,
    employee: `${m.name} 🎉`,
    type: 'anniversary',
    startDate: m.joinDate!.replace(/^\d{4}/, currentYear.toString()),
    endDate: m.joinDate!.replace(/^\d{4}/, currentYear.toString()),
    status: 'approved' as const,
  }))

  const allEvents = [...mapped, ...holidayEvents, ...bdays, ...workAnnis]

  return (
    <>
      <TopBar title="Team Calendar" />
      <CalendarGrid
        events={allEvents}
        isAdmin={isAdmin}
      />
    </>
  )
}
