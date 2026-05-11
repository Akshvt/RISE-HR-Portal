import { auth } from '@/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { TopBar } from '@/components/TopBar'
import { formatDate, leaveTypeLabel, leaveTypeClass } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// Map DB type values → UI display labels
function dbTypeLabel(type: string): string {
  const map: Record<string, string> = {
    full_day: 'Full Day',
    half_day_am: 'Half Day (AM)',
    half_day_pm: 'Half Day (PM)',
    sick: 'Sick Day',
    planned: 'Planned Leave',
    wfh: 'Work From Home',
  }
  return map[type] ?? type
}

function dbTypeClass(type: string): string {
  if (type === 'wfh') return 'leave-wfh'
  if (type === 'sick') return 'leave-sick'
  if (type === 'planned') return 'leave-planned'
  if (type.startsWith('half')) return 'leave-pto'
  return 'leave-pto'
}

async function getBalances(userEmail: string, airtableId?: string) {
  const year = new Date().getFullYear()
  const idToUse = airtableId || userEmail

  // Try leave_balances table first
  const { data: bal } = await supabaseAdmin
    .from('leave_balances')
    .select('pto_taken, wfh_taken')
    .eq('employee_airtable_id', idToUse)
    .eq('year', year)
    .single()

  if (bal) {
    const ptoTaken = Number(bal.pto_taken ?? 0)
    const wfhTaken = Number(bal.wfh_taken ?? 0)
    return { ptoTaken, wfhTaken, ptoRemaining: 20 - ptoTaken, wfhRemaining: 20 - wfhTaken }
  }

  // Fallback: calculate from leave_requests directly
  const { data } = await supabaseAdmin
    .from('leave_requests')
    .select('type, days_deducted, status')
    .eq('employee_email', userEmail)
    .eq('status', 'approved')
    .gte('start_date', `${year}-01-01`)
    .lte('end_date', `${year}-12-31`)

  let ptoTaken = 0, wfhTaken = 0
  for (const r of data || []) {
    if (r.type === 'wfh') wfhTaken += Number(r.days_deducted)
    else ptoTaken += Number(r.days_deducted)
  }
  return { ptoTaken, wfhTaken, ptoRemaining: 20 - ptoTaken, wfhRemaining: 20 - wfhTaken }
}

export default async function MyLeavePage() {
  const session = await auth()
  const email = session?.user?.email!
  const airtableId = (session?.user as any)?.airtableId

  const [balances, { data: requests }] = await Promise.all([
    getBalances(email, airtableId),
    supabaseAdmin
      .from('leave_requests')
      .select('id, type, start_date, end_date, days_deducted, status, reason')
      .eq('employee_email', email)
      .order('created_at', { ascending: false }),
  ])

  const { ptoTaken, wfhTaken, ptoRemaining, wfhRemaining } = balances

  return (
    <>
      <TopBar title="My Leave" actions={
        <Link href="/calendar" className="btn-gold" style={{ fontSize: 13, textDecoration: 'none', padding: '8px 16px' }}>
          + Request Leave
        </Link>
      } />
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960 }}>

        {/* Balance cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* PTO */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>PTO Balance</h3>
              <span style={{ fontSize: 12, color: 'rgba(96,165,250,0.9)', background: 'rgba(96,165,250,0.1)', padding: '3px 8px', borderRadius: 6 }}>Paid Time Off</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--brand-green)', marginBottom: 4 }}>
              {ptoRemaining.toFixed(1)}<span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 400 }}>/20 days</span>
            </div>
            <div style={{ marginTop: 12, height: 6, background: 'var(--border-strong)', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${Math.min((ptoTaken / 20) * 100, 100)}%`, background: 'linear-gradient(90deg, rgb(96,165,250), rgb(147,197,253))', borderRadius: 99 }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{ptoTaken.toFixed(1)} days used</div>
          </div>

          {/* WFH */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>WFH Balance</h3>
              <span style={{ fontSize: 12, color: 'rgba(52,211,153,0.9)', background: 'rgba(52,211,153,0.1)', padding: '3px 8px', borderRadius: 6 }}>Work From Home</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--brand-green)', marginBottom: 4 }}>
              {wfhRemaining.toFixed(1)}<span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 400 }}>/20 days</span>
            </div>
            <div style={{ marginTop: 12, height: 6, background: 'var(--border-strong)', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${Math.min((wfhTaken / 20) * 100, 100)}%`, background: 'linear-gradient(90deg, rgb(52,211,153), rgb(110,231,183))', borderRadius: 99 }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{wfhTaken.toFixed(1)} days used</div>
          </div>
        </div>

        {/* Leave history */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: 15, fontWeight: 600 }}>
            Leave History
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                {['Type', 'Dates', 'Duration', 'Status', 'Reason'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(requests || []).length === 0 && (
                <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No leave requests yet</td></tr>
              )}
              {(requests || []).map((r: {
                id: string; type: string; start_date: string; end_date: string;
                days_deducted: number; status: string; reason?: string
              }) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`pill ${dbTypeClass(r.type)}`} style={{ fontSize: 11 }}>{dbTypeLabel(r.type)}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                    {formatDate(r.start_date, 'dd MMM')} {r.start_date !== r.end_date ? `– ${formatDate(r.end_date, 'dd MMM')}` : ''}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{Number(r.days_deducted).toFixed(1)}d</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`pill pill-${r.status}`}>
                      {r.status === 'pending' && <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: 5 }} />}
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.reason || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
