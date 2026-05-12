'use client'

import { useState, Fragment } from 'react'
import { formatDate } from '@/lib/utils'

function dbTypeLabel(type: string): string {
  const map: Record<string, string> = {
    full_day: 'Full Day',
    half_day_am: 'Half Day (AM)',
    half_day_pm: 'Half Day (PM)',
    sick: 'Sick Day',
    planned: 'Planned Leave',
    wfh: 'WFH',
  }
  return map[type] ?? type
}

function dbTypeClass(type: string): string {
  if (type === 'wfh') return 'leave-wfh'
  if (type === 'sick') return 'leave-sick'
  if (type === 'planned') return 'leave-planned'
  return 'leave-pto'
}

type Leave = {
  id: string
  employee_name: string
  employee_email: string
  type: string
  start_date: string
  end_date: string
  days_deducted: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reason?: string
  rejection_reason?: string
  approved_by?: string
}

export function TeamLeavesTable({ initialLeaves }: { initialLeaves: Leave[] }) {
  const [leaves, setLeaves] = useState<Leave[]>(initialLeaves)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter)
  const pendingCount = leaves.filter(l => l.status === 'pending').length

  const callApi = async (id: string, method: 'PATCH' | 'DELETE', body?: object) => {
    const res = await fetch(`/api/leave/${id}`, {
      method,
      headers: method === 'DELETE' ? undefined : { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.error || `${method} failed`)
    }
    return method === 'DELETE' ? null : res.json()
  }

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this leave request?')) return
    setLoadingId(id)
    try {
      const updated = await callApi(id, 'PATCH', { action: 'approve' })
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l))
    } catch (e: any) { alert(e.message) }
    finally { setLoadingId(null) }
  }

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) { alert('Rejection reason is required'); return }
    setLoadingId(id)
    try {
      const updated = await callApi(id, 'PATCH', { action: 'reject', reason: rejectReason })
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l))
      setRejectingId(null)
      setRejectReason('')
    } catch (e: any) { alert(e.message) }
    finally { setLoadingId(null) }
  }

  const handleRevertPending = async (id: string) => {
    if (!confirm('Revert this leave back to pending?')) return
    setLoadingId(id)
    try {
      const updated = await callApi(id, 'PATCH', { action: 'pending' })
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l))
    } catch (e: any) { alert(e.message) }
    finally { setLoadingId(null) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this leave request? This cannot be undone.')) return
    setLoadingId(id)
    try {
      await callApi(id, 'DELETE')
      setLeaves(prev => prev.filter(l => l.id !== id))
    } catch (e: any) { alert(e.message) }
    finally { setLoadingId(null) }
  }

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: filter === f ? '1px solid var(--brand-green)' : '1px solid var(--text-muted)',
            background: filter === f ? 'var(--brand-green)' : 'transparent',
            color: filter === f ? '#FFFFFF' : 'var(--text-primary)',
            textTransform: 'capitalize',
            transition: 'all 0.15s ease-in-out',
            opacity: filter === f ? 1 : 0.7,
          }}>
            {f === 'all' ? `All (${leaves.length})` : f === 'pending' ? `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['Employee', 'Type', 'Dates', 'Days', 'Status', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', fontWeight: 600, fontSize: 11,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: 'var(--text-muted)'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((leave) => (
              <Fragment key={leave.id}>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', opacity: loadingId === leave.id ? 0.5 : 1 }}>

                  {/* Employee */}
                  <td style={{ padding: '14px 16px', fontWeight: 500 }}>
                    {leave.employee_name}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{leave.employee_email}</div>
                  </td>

                  {/* Type */}
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`pill ${dbTypeClass(leave.type)}`} style={{ fontSize: 11 }}>
                      {dbTypeLabel(leave.type)}
                    </span>
                    {leave.reason && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {leave.reason}
                      </div>
                    )}
                  </td>

                  {/* Dates */}
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {formatDate(leave.start_date, 'dd MMM')}
                    {leave.start_date !== leave.end_date && ` – ${formatDate(leave.end_date, 'dd MMM')}`}
                  </td>

                  {/* Days */}
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                    {Number(leave.days_deducted).toFixed(1)}d
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`pill pill-${leave.status}`}>{leave.status}</span>
                    {leave.rejection_reason && (
                      <div style={{ fontSize: 11, color: 'rgba(248,113,113,0.8)', marginTop: 4 }}>
                        {leave.rejection_reason}
                      </div>
                    )}
                    {leave.approved_by && leave.status === 'approved' && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        by {leave.approved_by.split('@')[0]}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>

                      {/* Pending: Approve + Reject */}
                      {leave.status === 'pending' && (
                        <>
                          <ActionBtn
                            color="#10B981"
                            label="Approve"
                            disabled={loadingId === leave.id}
                            onClick={() => handleApprove(leave.id)}
                          />
                          <ActionBtn
                            color="#EF4444"
                            label="Reject"
                            disabled={loadingId === leave.id}
                            onClick={() => { setRejectingId(leave.id); setRejectReason('') }}
                          />
                        </>
                      )}

                      {/* Approved: Revert to pending */}
                      {leave.status === 'approved' && (
                        <ActionBtn
                          color="#F59E0B"
                          label="Revert"
                          title="Revert back to pending"
                          disabled={loadingId === leave.id}
                          onClick={() => handleRevertPending(leave.id)}
                        />
                      )}

                      {/* Rejected: Re-approve */}
                      {leave.status === 'rejected' && (
                        <ActionBtn
                          color="#10B981"
                          label="Re-approve"
                          disabled={loadingId === leave.id}
                          onClick={() => handleApprove(leave.id)}
                        />
                      )}

                      {/* All statuses: Delete */}
                      <ActionBtn
                        color="#6B7280"
                        label="Delete"
                        disabled={loadingId === leave.id}
                        onClick={() => handleDelete(leave.id)}
                      />
                    </div>
                  </td>
                </tr>

                {/* Inline reject form */}
                {rejectingId === leave.id && (
                  <tr style={{ background: 'rgba(239,68,68,0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <td colSpan={6} style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', maxWidth: 600 }}>
                        <input
                          className="input-glass"
                          placeholder="Rejection reason (required)..."
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleReject(leave.id)}
                          style={{ flex: 1, fontSize: 13 }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleReject(leave.id)}
                          disabled={loadingId === leave.id}
                          style={{ padding: '8px 16px', borderRadius: 8, background: '#EF4444', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {loadingId === leave.id ? '…' : 'Confirm Reject'}
                        </button>
                        <button
                          onClick={() => setRejectingId(null)}
                          style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {filter === 'all' ? 'No leave requests yet.' : `No ${filter} requests.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ActionBtn({ label, color, onClick, disabled, title }: {
  label: string
  color: string
  onClick: () => void
  disabled: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '4px 10px',
        borderRadius: 6,
        border: `1px solid ${color}33`,
        background: `${color}15`,
        color: color,
        fontSize: 11,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}
