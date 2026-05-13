import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  isWeekend, isSunday, isSaturday, eachDayOfInterval,
  format, parseISO, isValid
} from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import holidaysData from './holidays.json'

/** India gazetted holidays for 2026 (ISO strings) */
export const INDIA_HOLIDAYS_2026: string[] = holidaysData.map(h => h.date)

function isHoliday(date: Date, holidays: string[]): boolean {
  return holidays.includes(format(date, 'yyyy-MM-dd'))
}

/**
 * Calculate working days deducted for a leave range.
 * - Sunday = 0
 * - National holiday = 0
 * - Saturday full day = 0.5, Saturday half day = 0.25
 * - Mon–Fri full day = 1.0, half day = 0.5
 */
export function calculateDeduction(
  startDate: Date,
  endDate: Date,
  leaveType: 'full' | 'half',
  holidays: string[] = INDIA_HOLIDAYS_2026
): number {
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  let total = 0
  for (const day of days) {
    if (isSunday(day) || isHoliday(day, holidays)) continue
    if (isSaturday(day)) {
      total += leaveType === 'half' ? 0.25 : 0.5
    } else {
      total += leaveType === 'half' ? 0.5 : 1.0
    }
  }
  return total
}

export function formatDate(dateStr: string | null | undefined, fmt = 'dd MMM yyyy'): string {
  if (!dateStr) return '—'
  try {
    const d = parseISO(dateStr)
    return isValid(d) ? format(d, fmt) : '—'
  } catch { return '—' }
}

export function avatarInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function leaveTypeLabel(type: string): string {
  const map: Record<string, string> = {
    full: 'Full Day',
    half: 'Half Day',
    sick: 'Sick Day',
    planned: 'Planned Leave',
    wfh: 'Work From Home',
    birthday: 'Birthday',
    anniversary: 'Work Anniversary',
  }
  return map[type] ?? type
}

export function leaveTypeClass(type: string): string {
  const map: Record<string, string> = {
    full: 'leave-pto',
    half: 'leave-pto',
    sick: 'leave-sick',
    planned: 'leave-planned',
    wfh: 'leave-wfh',
    holiday: 'leave-holiday',
    birthday: 'leave-birthday',
    anniversary: 'leave-anniversary',
  }
  return map[type] ?? 'leave-pto'
}
