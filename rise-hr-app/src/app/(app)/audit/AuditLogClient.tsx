'use client'
import { useState } from 'react'
import { formatDate } from '@/lib/utils'

const ACTION_LABELS: Record<string, string> = {
  sign_in: 'Sign In',
  leave_submitted: 'Leave Submitted',
  leave_approved: 'Leave Approved',
  leave_rejected: 'Leave Rejected',
  leave_deleted: 'Leave Deleted',
  post_created: 'Post Created',
  post_updated: 'Post Updated',
  post_deleted: 'Post Deleted',
  reply_deleted: 'Reply Deleted',
}

interface AuditEntry {
  id: string
  created_at: string
  actor_name: string
  actor_role?: string
  actor_airtable_id: string
  action_type: string
  before_json?: any
  after_json?: any
  target?: string
}

export function AuditLogClient({ entries }: { entries: AuditEntry[] }) {
  const [roleFilter, setRoleFilter] = useState<string>('All')
  const [typeFilter, setTypeFilter] = useState<string>('All')

  // Predefined lists to ensure they always show up
  const ALL_ROLES = ['Admin', 'HR', 'Employee']
  const ALL_CATEGORIES = ['Leave Management', 'Announcements', 'Calendar']

  // Basic categorization logic for types
  const getCategory = (action: string) => {
    if (action.startsWith('post_') || action.startsWith('reply_') || action.includes('announcement')) return 'Announcements'
    if (action.includes('calendar') || action.includes('event')) return 'Calendar'
    if (action.startsWith('leave_')) return 'Leave Management'
    return 'Other' 
  }

  // Filter the entries
  const filteredEntries = entries.filter(e => {
    const roleMatch = roleFilter === 'All' || (e.actor_role || 'Unknown') === roleFilter
    const categoryMatch = typeFilter === 'All' || getCategory(e.action_type || '') === typeFilter
    const isRecognizedCategory = ['Leave Management', 'Announcements', 'Calendar'].includes(getCategory(e.action_type || ''))
    return roleMatch && categoryMatch && isRecognizedCategory
  })

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header and Filters */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>System Events</span>
          <span className="pill" style={{ fontSize: 11, background: 'var(--surface-low)', border: '1px solid var(--border-subtle)' }}>
            {filteredEntries.length} entries
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {/* Role Filter */}
          <select 
            className="input-glass" 
            style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* Type Filter */}
          <select 
            className="input-glass" 
            style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Events</option>
            {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Scrollable Table Area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface-high)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--border-subtle)' }}>
            <tr>
              {['Timestamp', 'Actor', 'Action', 'Details'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!filteredEntries || filteredEntries.length === 0) && (
              <tr><td colSpan={4} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No events match your filters</td></tr>
            )}
            {filteredEntries.map((e) => (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 150ms ease' }}
                  onMouseEnter={(ev) => ev.currentTarget.style.background = 'var(--surface-low)'}
                  onMouseLeave={(ev) => ev.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {formatDate(e.created_at, 'dd MMM yyyy, HH:mm')}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.actor_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{e.actor_role || e.actor_airtable_id}</div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span className="pill" style={{
                    background: 'var(--brand-green-dim)', color: 'var(--brand-green)',
                    border: '1px solid rgba(28, 124, 84, 0.25)', fontSize: 11,
                  }}>
                    {ACTION_LABELS[e.action_type] ?? e.action_type ?? 'Unknown'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: 12, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.after_json ? JSON.stringify(e.after_json) : e.before_json ? JSON.stringify(e.before_json) : e.target ? `Target: ${e.target}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
