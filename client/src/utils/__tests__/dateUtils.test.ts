import { describe, it, expect } from 'bun:test'
import {
  hoursUntilDue,
  getDueDateWarningLevel,
  getWarningClasses,
  getWarningBackground,
  formatRelativeDate,
  getDefaultDueDate,
  formatDateForInput,
  formatDateTime,
} from '../dateUtils'
import type { DueDateWarnings } from '../../types'

const defaultWarnings: DueDateWarnings = {
  urgent: 1,
  warning: 24,
  approaching: 72,
}

describe('hoursUntilDue', () => {
  it('should return positive hours for future dates', () => {
    const futureDate = new Date()
    futureDate.setHours(futureDate.getHours() + 5)
    const hours = hoursUntilDue(futureDate.toISOString())
    expect(hours).toBeGreaterThan(4)
    expect(hours).toBeLessThan(6)
  })

  it('should return negative hours for past dates', () => {
    const pastDate = new Date()
    pastDate.setHours(pastDate.getHours() - 5)
    const hours = hoursUntilDue(pastDate.toISOString())
    expect(hours).toBeLessThan(-4)
    expect(hours).toBeGreaterThan(-6)
  })
})

describe('getDueDateWarningLevel', () => {
  it('should return normal for null due date', () => {
    const level = getDueDateWarningLevel(null, defaultWarnings)
    expect(level).toBe('normal')
  })

  it('should return overdue for past dates', () => {
    const pastDate = new Date()
    pastDate.setHours(pastDate.getHours() - 1)
    const level = getDueDateWarningLevel(pastDate.toISOString(), defaultWarnings)
    expect(level).toBe('overdue')
  })

  it('should return urgent for dates within urgent threshold', () => {
    const urgentDate = new Date()
    urgentDate.setMinutes(urgentDate.getMinutes() + 30)
    const level = getDueDateWarningLevel(urgentDate.toISOString(), defaultWarnings)
    expect(level).toBe('urgent')
  })

  it('should return warning for dates within warning threshold', () => {
    const warningDate = new Date()
    warningDate.setHours(warningDate.getHours() + 12)
    const level = getDueDateWarningLevel(warningDate.toISOString(), defaultWarnings)
    expect(level).toBe('warning')
  })

  it('should return approaching for dates within approaching threshold', () => {
    const approachingDate = new Date()
    approachingDate.setHours(approachingDate.getHours() + 48)
    const level = getDueDateWarningLevel(approachingDate.toISOString(), defaultWarnings)
    expect(level).toBe('approaching')
  })

  it('should return normal for dates beyond approaching threshold', () => {
    const normalDate = new Date()
    normalDate.setDate(normalDate.getDate() + 7)
    const level = getDueDateWarningLevel(normalDate.toISOString(), defaultWarnings)
    expect(level).toBe('normal')
  })
})

describe('getWarningClasses', () => {
  it('should return overdue classes', () => {
    const classes = getWarningClasses('overdue')
    expect(classes).toContain('animate-pulse-overdue')
    expect(classes).toContain('ring-red-500')
  })

  it('should return urgent classes', () => {
    const classes = getWarningClasses('urgent')
    expect(classes).toContain('animate-pulse-urgent')
  })

  it('should return warning classes', () => {
    const classes = getWarningClasses('warning')
    expect(classes).toContain('animate-pulse-warning')
  })

  it('should return approaching classes', () => {
    const classes = getWarningClasses('approaching')
    expect(classes).toContain('ring-yellow')
  })

  it('should return empty string for normal', () => {
    const classes = getWarningClasses('normal')
    expect(classes).toBe('')
  })
})

describe('getWarningBackground', () => {
  it('should return overdue background', () => {
    const bg = getWarningBackground('overdue')
    expect(bg).toContain('bg-red')
  })

  it('should return urgent background', () => {
    const bg = getWarningBackground('urgent')
    expect(bg).toContain('bg-red')
  })

  it('should return warning background', () => {
    const bg = getWarningBackground('warning')
    expect(bg).toContain('bg-orange')
  })

  it('should return approaching background', () => {
    const bg = getWarningBackground('approaching')
    expect(bg).toContain('bg-yellow')
  })

  it('should return empty string for normal', () => {
    const bg = getWarningBackground('normal')
    expect(bg).toBe('')
  })
})

describe('formatRelativeDate', () => {
  it('should return "Overdue" for recently past dates', () => {
    const pastDate = new Date()
    pastDate.setMinutes(pastDate.getMinutes() - 30)
    const result = formatRelativeDate(pastDate.toISOString())
    expect(result).toBe('Overdue')
  })

  it('should return hours overdue for past dates within a day', () => {
    const pastDate = new Date()
    pastDate.setHours(pastDate.getHours() - 5)
    const result = formatRelativeDate(pastDate.toISOString())
    expect(result).toContain('overdue')
  })

  it('should return "Due soon" for dates within an hour', () => {
    const soonDate = new Date()
    soonDate.setMinutes(soonDate.getMinutes() + 30)
    const result = formatRelativeDate(soonDate.toISOString())
    expect(result).toBe('Due soon')
  })

  it('should return "In Xh" for dates within a day', () => {
    const hoursDate = new Date()
    hoursDate.setHours(hoursDate.getHours() + 5)
    const result = formatRelativeDate(hoursDate.toISOString())
    expect(result).toMatch(/In \d+h/)
  })

  it('should return "Tomorrow" for dates 1-2 days away', () => {
    const tomorrowDate = new Date()
    tomorrowDate.setHours(tomorrowDate.getHours() + 30)
    const result = formatRelativeDate(tomorrowDate.toISOString())
    expect(result).toBe('Tomorrow')
  })

  it('should return "In Xd" for dates within a week', () => {
    const daysDate = new Date()
    daysDate.setDate(daysDate.getDate() + 4)
    const result = formatRelativeDate(daysDate.toISOString())
    expect(result).toMatch(/In \d+d/)
  })

  it('should return "Next week" for dates 7-14 days away', () => {
    const nextWeekDate = new Date()
    nextWeekDate.setDate(nextWeekDate.getDate() + 10)
    const result = formatRelativeDate(nextWeekDate.toISOString())
    expect(result).toBe('Next week')
  })
})

describe('getDefaultDueDate', () => {
  it('should return a date X days from now', () => {
    const result = getDefaultDueDate(3)
    const expected = new Date()
    expected.setDate(expected.getDate() + 3)

    const resultDate = new Date(result)
    expect(resultDate.getDate()).toBe(expected.getDate())
  })

  it('should set time to 5 PM', () => {
    const result = getDefaultDueDate(1)
    const resultDate = new Date(result)
    expect(resultDate.getHours()).toBe(17)
  })
})

describe('formatDateForInput', () => {
  it('should return empty string for null', () => {
    const result = formatDateForInput(null)
    expect(result).toBe('')
  })

  it('should return YYYY-MM-DD format', () => {
    const result = formatDateForInput('2024-03-15T10:00:00Z')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('formatDateTime', () => {
  it('should format date and time', () => {
    const result = formatDateTime('2024-03-15T14:30:00Z')
    expect(result).toContain('Mar')
    expect(result).toContain('15')
  })
})
