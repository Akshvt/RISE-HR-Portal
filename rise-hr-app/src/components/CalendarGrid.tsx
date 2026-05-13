'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameMonth, isSameDay, parseISO, isToday,
  addMonths, subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { LeaveModal } from './LeaveModal'
import { leaveTypeClass, leaveTypeLabel } from '@/lib/utils'

interface LeaveEvent {
  id: string
  employee: string
  type: string
  startDate: string
  endDate: string
  status: 'approved' | 'pending' | 'rejected'
  reason?: string
}

interface CalendarGridProps {
  events: LeaveEvent[]
  isAdmin: boolean
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarGrid({ events, isAdmin }: CalendarGridProps) {
  const router = useRouter()
  const [current, setCurrent] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showModal, setShowModal] = useState(false)

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const startPad = getDay(monthStart)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const eventsOnDay = (date: Date) =>
    events.filter(e => {
      const start = parseISO(e.startDate)
      const end = parseISO(e.endDate)
      return date >= start && date <= end
    })

  return (
    <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-glass" style={{ padding: '8px 10px' }} onClick={() => setCurrent(subMonths(current, 1))}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', minWidth: 180, textAlign: 'center' }}>
            {format(current, 'MMMM yyyy')}
          </span>
          <button className="btn-glass" style={{ padding: '8px 10px' }} onClick={() => setCurrent(addMonths(current, 1))}>
            <ChevronRight size={16} />
          </button>
          <button className="btn-glass" onClick={() => setCurrent(new Date())} style={{ fontSize: 13 }}>Today</button>
        </div>
        <button className="btn-gold" onClick={() => { setSelectedDate(new Date()); setShowModal(true) }}>
          <Plus size={15} /> Request Leave
        </button>
      </div>

      {/* Grid */}
      <div className="glass-card" style={{ flex: 1, overflow: 'hidden' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-subtle)' }}>
          {DAYS.map(d => (
            <div key={d} style={{
              padding: '10px 0', textAlign: 'center',
              fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(80px, 1fr)' }}>
          {/* Padding cells */}
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} style={{ borderRight: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }} />
          ))}

          {days.map(day => {
            const dayEvents = eventsOnDay(day)
            const today = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <div
                key={day.toISOString()}
                onClick={() => { setSelectedDate(day); setShowModal(true) }}
                style={{
                  borderRight: '1px solid var(--border-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                  padding: '6px 8px', cursor: 'pointer', minHeight: 80,
                  background: today ? 'var(--brand-green-dim)' : isSelected ? 'var(--surface-low)' : 'transparent',
                  transition: 'background 150ms ease',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!today) e.currentTarget.style.background = 'var(--surface-low)' }}
                onMouseLeave={e => { if (!today) e.currentTarget.style.background = isSelected ? 'var(--surface-low)' : 'transparent' }}>
                {/* Date number */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', marginBottom: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: today ? 'var(--brand-green)' : 'transparent',
                  color: today ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: today ? 700 : 400,
                  boxShadow: today ? '0 0 10px rgba(28, 124, 84, 0.4)' : 'none',
                }}>
                  {format(day, 'd')}
                </div>

                {/* Events */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {dayEvents.slice(0, 3).map(ev => (
                    <div key={ev.id} className={`pill ${leaveTypeClass(ev.type)}`} style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 4,
                      opacity: ev.status === 'pending' ? 0.7 : 1,
                      backgroundImage: ev.status === 'pending'
                        ? 'repeating-linear-gradient(45deg, transparent, transparent 3px, var(--border-subtle) 3px, var(--border-subtle) 6px)'
                        : 'none',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {ev.employee.split(' ')[0]} · {leaveTypeLabel(ev.type).replace(' ', '\u00A0')}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', paddingLeft: 4 }}>
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showModal && (
        <LeaveModal
          defaultDate={selectedDate || new Date()}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); router.refresh() }}
        />
      )}
    </div>
  )
}
