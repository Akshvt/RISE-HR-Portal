'use client'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { X, Loader2 } from 'lucide-react'
import { calculateDeduction } from '@/lib/utils'

interface LeaveModalProps {
  defaultDate: Date
  onClose: () => void
  onSuccess: () => void
}

const LEAVE_TYPES = [
  { value: 'full', label: 'Full Day', bucket: 'PTO' },
  { value: 'half', label: 'Half Day', bucket: 'PTO' },
  { value: 'sick', label: 'Sick Day', bucket: 'PTO' },
  { value: 'planned', label: 'Planned', bucket: 'PTO' },
  { value: 'wfh', label: 'WFH', bucket: 'WFH' },
]

export function LeaveModal({ defaultDate, onClose, onSuccess }: LeaveModalProps) {
  const [leaveType, setLeaveType] = useState('full')
  const [startDate, setStartDate] = useState(format(defaultDate, 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(defaultDate, 'yyyy-MM-dd'))
  const [halfSession, setHalfSession] = useState<'AM' | 'PM'>('AM')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const deduction = calculateDeduction(parseISO(startDate), parseISO(endDate), leaveType === 'half' ? 'half' : 'full')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveType, startDate, endDate, halfSession: leaveType === 'half' ? halfSession : null, reason }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      onSuccess()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel animate-fadeIn" style={{ padding: 32 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>Request Leave</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Leave type */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Leave Type
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {LEAVE_TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => setLeaveType(t.value)}
                  style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    background: leaveType === t.value ? 'var(--brand-green-dim)' : 'var(--surface-low)',
                    border: leaveType === t.value ? '1px solid rgba(28, 124, 84, 0.4)' : '1px solid var(--border-strong)',
                    color: leaveType === t.value ? 'var(--brand-green)' : 'var(--text-secondary)',
                    transition: 'all 150ms ease',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Start Date
              </label>
              <input type="date" className="input-glass" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                End Date
              </label>
              <input type="date" className="input-glass" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
          </div>

          {/* Half day AM/PM */}
          {leaveType === 'half' && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Session</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['AM', 'PM'] as const).map(s => (
                  <button key={s} type="button" onClick={() => setHalfSession(s)}
                    style={{
                      padding: '7px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                      background: halfSession === s ? 'var(--brand-green-dim)' : 'var(--surface-low)',
                      border: halfSession === s ? '1px solid rgba(28, 124, 84, 0.4)' : '1px solid var(--border-strong)',
                      color: halfSession === s ? 'var(--brand-green)' : 'var(--text-secondary)',
                    }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Reason <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <textarea className="input-glass" rows={3} placeholder="Add a reason for your leave request..."
              value={reason} onChange={e => setReason(e.target.value)}
              style={{ resize: 'vertical' }} />
          </div>

          {/* Balance preview */}
          <div style={{
            background: 'var(--surface-low)', border: '1px solid var(--border-subtle)',
            borderRadius: 12, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Days to deduct: <span style={{ color: 'var(--brand-green)', fontWeight: 600 }}>{deduction}</span> from {leaveType === 'wfh' ? 'WFH' : 'PTO'}
            </div>
            {leaveType === 'sick' && (
              <div style={{ fontSize: 12, color: 'rgba(251,191,36,0.8)' }}>
                ⚡ Sick days are auto-approved. HR will be notified.
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#F87171' }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-glass" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={loading} style={{ minWidth: 140, justifyContent: 'center' }}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {loading ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
