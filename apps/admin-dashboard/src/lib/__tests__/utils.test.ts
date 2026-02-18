import { describe, it, expect } from 'vitest'
import { 
  cn, 
  formatCurrency, 
  formatNumber, 
  formatDate, 
  formatDateTime, 
  formatRelativeTime 
} from '../utils'

describe('cn (className utility)', () => {
  it('merges class names correctly', () => {
    const result = cn('class1', 'class2')
    expect(result).toBe('class1 class2')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const result = cn('base', isActive && 'active', !isActive && 'inactive')
    expect(result).toBe('base active')
  })

  it('handles undefined and null values', () => {
    const result = cn('base', undefined, null, 'other')
    expect(result).toBe('base other')
  })

  it('merges tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4')
    // Tailwind merge should keep the last conflicting class
    expect(result).toBe('py-1 px-4')
  })

  it('handles array of classes', () => {
    const result = cn(['class1', 'class2'], 'class3')
    expect(result).toBe('class1 class2 class3')
  })

  it('handles object syntax', () => {
    const result = cn({ active: true, disabled: false })
    expect(result).toBe('active')
  })
})

describe('formatCurrency', () => {
  it('formats EUR currency correctly', () => {
    const result = formatCurrency(1500)
    expect(result).toBe('1.500 €')
  })

  it('handles zero', () => {
    const result = formatCurrency(0)
    expect(result).toBe('0 €')
  })

  it('handles large numbers', () => {
    const result = formatCurrency(1234567)
    expect(result).toBe('1.234.567 €')
  })

  it('handles decimals (rounds to 0)', () => {
    const result = formatCurrency(1500.50)
    expect(result).toBe('1.501 €') // Rounds up
  })

  it('handles negative values', () => {
    const result = formatCurrency(-500)
    expect(result).toBe('-500 €')
  })
})

describe('formatNumber', () => {
  it('formats with Italian locale', () => {
    const result = formatNumber(1234567)
    expect(result).toBe('1.234.567')
  })

  it('handles zero', () => {
    const result = formatNumber(0)
    expect(result).toBe('0')
  })

  it('handles small numbers', () => {
    const result = formatNumber(42)
    expect(result).toBe('42')
  })

  it('handles negative numbers', () => {
    const result = formatNumber(-999)
    expect(result).toBe('-999')
  })
})

describe('formatDate', () => {
  it('formats date with Italian locale', () => {
    const date = '2024-01-15'
    const result = formatDate(date)
    // Italian format: 15 gen 2024
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })

  it('handles Date object', () => {
    const date = new Date('2024-06-20')
    const result = formatDate(date)
    expect(result).toContain('20')
    expect(result).toContain('2024')
  })

  it('handles ISO string with time', () => {
    const date = '2024-01-15T10:30:00Z'
    const result = formatDate(date)
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })
})

describe('formatDateTime', () => {
  it('formats with time', () => {
    const date = '2024-01-15T14:30:00'
    const result = formatDateTime(date)
    expect(result).toContain('15')
    expect(result).toContain('2024')
    // Should contain time component
    expect(result).toMatch(/\d{2}:\d{2}/)
  })

  it('handles Date object', () => {
    const date = new Date('2024-06-20T09:15:00')
    const result = formatDateTime(date)
    expect(result).toContain('20')
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})

describe('formatRelativeTime', () => {
  it('returns "ora" for very recent times', () => {
    const now = new Date()
    const justNow = new Date(now.getTime() - 30 * 1000) // 30 seconds ago
    const result = formatRelativeTime(justNow.toISOString())
    expect(result).toBe('ora')
  })

  it('returns minutes for recent times', () => {
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const result = formatRelativeTime(fiveMinutesAgo.toISOString())
    expect(result).toBe('5m fa')
  })

  it('returns hours for times within a day', () => {
    const now = new Date()
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
    const result = formatRelativeTime(threeHoursAgo.toISOString())
    expect(result).toBe('3h fa')
  })

  it('returns days for older times', () => {
    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    const result = formatRelativeTime(twoDaysAgo.toISOString())
    expect(result).toBe('2g fa')
  })

  it('handles exact hour boundaries', () => {
    const now = new Date()
    const exactlyOneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const result = formatRelativeTime(exactlyOneHourAgo.toISOString())
    expect(result).toBe('1h fa')
  })

  it('handles exact day boundaries', () => {
    const now = new Date()
    const exactlyOneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const result = formatRelativeTime(exactlyOneDayAgo.toISOString())
    expect(result).toBe('1g fa')
  })
})
