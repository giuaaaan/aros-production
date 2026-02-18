import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { createAdminClient } from '@/lib/supabase/server'

// Mock the server client
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}))

describe('GET /api/dashboard/stats', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createAdminClient as any).mockReturnValue(mockSupabase)
  })

  it('returns dashboard stats successfully', async () => {
    // Mock organizations query
    const mockOrgs = [
      { subscription_tier: 'professional', subscription_status: 'active' },
      { subscription_tier: 'starter', subscription_status: 'active' },
      { subscription_tier: 'enterprise', subscription_status: 'paused' },
    ]

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return {
          select: vi.fn().mockResolvedValue({ data: mockOrgs }),
        }
      }
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          count: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({ count: 42 }),
        }
      }
      return mockSupabase
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('totalRevenue')
    expect(data).toHaveProperty('activeCustomers')
    expect(data).toHaveProperty('todayCalls')
    expect(data).toHaveProperty('systemHealth')
    expect(data).toHaveProperty('revenueChange')
    expect(data).toHaveProperty('customersChange')
    expect(data).toHaveProperty('callsChange')
    expect(data).toHaveProperty('healthStatus')
  })

  it('calculates revenue correctly', async () => {
    const mockOrgs = [
      { subscription_tier: 'starter', subscription_status: 'active' },      // 79
      { subscription_tier: 'professional', subscription_status: 'active' }, // 149
      { subscription_tier: 'enterprise', subscription_status: 'active' },   // 299
      { subscription_tier: 'starter', subscription_status: 'cancelled' },   // 0 (inactive)
    ]

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return {
          select: vi.fn().mockResolvedValue({ data: mockOrgs }),
        }
      }
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          count: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({ count: 10 }),
        }
      }
      return mockSupabase
    })

    const response = await GET()
    const data = await response.json()

    // 79 + 149 + 299 = 527
    expect(data.totalRevenue).toBe(527)
    expect(data.activeCustomers).toBe(3)
  })

  it('handles unknown tier values gracefully', async () => {
    const mockOrgs = [
      { subscription_tier: 'unknown_tier', subscription_status: 'active' },
      { subscription_tier: 'starter', subscription_status: 'active' },
    ]

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return {
          select: vi.fn().mockResolvedValue({ data: mockOrgs }),
        }
      }
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          count: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({ count: 5 }),
        }
      }
      return mockSupabase
    })

    const response = await GET()
    const data = await response.json()

    // Should only count starter tier (79), unknown tier = 0
    expect(data.totalRevenue).toBe(79)
  })

  it('returns 500 on database error', async () => {
    mockSupabase.from.mockImplementation(() => {
      throw new Error('Database connection failed')
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toHaveProperty('error', 'Failed to fetch stats')
  })

  it('handles empty organizations gracefully', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return {
          select: vi.fn().mockResolvedValue({ data: [] }),
        }
      }
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          count: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({ count: 0 }),
        }
      }
      return mockSupabase
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalRevenue).toBe(0)
    expect(data.activeCustomers).toBe(0)
    expect(data.todayCalls).toBe(0)
  })

  it('returns health status as operational by default', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return {
          select: vi.fn().mockResolvedValue({ data: [] }),
        }
      }
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          count: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({ count: 0 }),
        }
      }
      return mockSupabase
    })

    const response = await GET()
    const data = await response.json()

    expect(data.systemHealth).toBe(99.9)
    expect(data.healthStatus).toBe('operational')
  })

  it('returns mock change percentages', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return {
          select: vi.fn().mockResolvedValue({ data: [] }),
        }
      }
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          count: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({ count: 0 }),
        }
      }
      return mockSupabase
    })

    const response = await GET()
    const data = await response.json()

    expect(typeof data.revenueChange).toBe('number')
    expect(typeof data.customersChange).toBe('number')
    expect(typeof data.callsChange).toBe('number')
  })
})
