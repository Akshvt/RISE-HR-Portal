import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function dbTypeLabel(type: string): string {
  const map: Record<string, string> = {
    full_day: 'Full Day', half_day_am: 'Half Day AM', half_day_pm: 'Half Day PM',
    sick: 'Sick Day', planned: 'Planned', wfh: 'WFH',
  }
  return map[type] ?? type
}

export default async function InsightsPage() {
  const session = await auth()
  if (!['Admin', 'HR'].includes(session?.user?.role ?? '')) redirect('/calendar')

  const today = new Date().toISOString().slice(0, 10)
  const year = new Date().getFullYear()

  const [{ count: onLeaveToday }, { count: pendingCount }, { data: allRequests }] = await Promise.all([
    supabaseAdmin.from('leave_requests').select('*', { count: 'exact', head: true })
      .eq('status', 'approved').lte('start_date', today).gte('end_date', today),
    supabaseAdmin.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('leave_requests')
      .select('employee_email, employee_name, type, days_deducted, status, start_date, end_date')
      .eq('status', 'approved').gte('start_date', `${year}-01-01`),
  ])

  type EmployeeStats = { email: string; name: string; ptoTaken: number; wfhTaken: number; lastLeave: string }
  const empMap: Record<string, EmployeeStats> = {}
  for (const r of allRequests || []) {
    const key = r.employee_email
    if (!empMap[key]) empMap[key] = { email: key, name: r.employee_name, ptoTaken: 0, wfhTaken: 0, lastLeave: '' }
    if (r.type === 'wfh') empMap[key].wfhTaken += Number(r.days_deducted)
    else empMap[key].ptoTaken += Number(r.days_deducted)
    if (r.end_date > empMap[key].lastLeave) empMap[key].lastLeave = r.end_date
  }
  const employees = Object.values(empMap)
  const zeroBalanceCount = employees.filter(e => e.ptoTaken >= 20).length

  const statCards = [
    { label: 'On Leave Today', value: onLeaveToday ?? 0, color: 'rgb(96,165,250)', bg: 'rgba(96,165,250,0.1)' },
    { label: 'Pending Approvals', value: pendingCount ?? 0, color: 'rgb(251,191,36)', bg: 'rgba(251,191,36,0.1)' },
    { label: 'Zero PTO Remaining', value: zeroBalanceCount, color: 'rgb(248,113,113)', bg: 'rgba(248,113,113,0.1)' },
  ]

  return (
    <>
      <TopBar title="Quick Insights" actions={
        <Link href="/api/insights/export" className="btn-glass" style={{ textDecoration: 'none', fontSize: 13, padding: '8px 16px' }}>
          Export CSV
        </Link>
      } />
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {statCards.map(s => (
            <div key={s.label} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ height: 3, background: s.bg, borderRadius: 99 }}>
                <div style={{ height: '100%', width: '60%', background: s.color, borderRadius: 99, opacity: 0.6 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Employee table */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: 15, fontWeight: 600 }}>
            Employee Leave Summary — {year}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                {['Employee', 'PTO Taken', 'PTO Remaining', 'WFH Taken', 'WFH Remaining', 'Last Leave'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No data yet</td></tr>
              )}
              {employees.map(e => (
                <tr key={e.email} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                    {e.name}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{e.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--border-subtle)', borderRadius: 99, maxWidth: 80 }}>
                        <div style={{ height: '100%', width: `${Math.min((e.ptoTaken / 20) * 100, 100)}%`, background: 'rgb(96,165,250)', borderRadius: 99 }} />
                      </div>
                      <span style={{ color: 'var(--text-secondary)', minWidth: 24 }}>{e.ptoTaken.toFixed(1)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: e.ptoTaken >= 20 ? 'rgb(248,113,113)' : 'var(--text-secondary)', fontWeight: e.ptoTaken >= 20 ? 600 : 400 }}>
                    {(20 - e.ptoTaken).toFixed(1)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--border-subtle)', borderRadius: 99, maxWidth: 80 }}>
                        <div style={{ height: '100%', width: `${Math.min((e.wfhTaken / 20) * 100, 100)}%`, background: 'rgb(52,211,153)', borderRadius: 99 }} />
                      </div>
                      <span style={{ color: 'var(--text-secondary)', minWidth: 24 }}>{e.wfhTaken.toFixed(1)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{(20 - e.wfhTaken).toFixed(1)}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(e.lastLeave)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
