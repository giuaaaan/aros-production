import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { createAdminClient } from '@/lib/supabase/server'

// Mock the server client
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}))

describe('GET /api/organizations', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createAdminClient as any).mockReturnValue(mockSupabase)
  })

  it('returns organizations list', async () => {
    const mockData = [
      {
        id: '1',
        name: 'Test Org',
        subscription_status: 'active',
        subscription_tier: 'professional',
        users: [{ count: 5 }],
        appointments: [{ count: 10 }],
      },
    ]

    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      }),
    }))

    const request = new Request('http://localhost/api/organizations')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('organizations')
    expect(data).toHaveProperty('total')
    expect(data.organizations).toHaveLength(1)
    expect(data.organizations[0]).toHaveProperty('user_count', 5)
    expect(data.organizations[0]).toHaveProperty('appointment_count', 10)
  })

  it('applies search filter', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    }))

    const request = new Request('http://localhost/api/organizations?search=test')
    await GET(request)

    const mockQuery = mockSupabase.from.mock.results[0].value
    expect(mockQuery.or).toHaveBeenCalledWith('name.ilike.%test%,phone_number.ilike.%test%')
  })

  it('applies status filter', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    }))

    const request = new Request('http://localhost/api/organizations?status=active')
    await GET(request)

    const mockQuery = mockSupabase.from.mock.results[0].value
    expect(mockQuery.eq).toHaveBeenCalledWith('subscription_status', 'active')
  })

  it('applies tier filter', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    }))

    const request = new Request('http://localhost/api/organizations?tier=enterprise')
    await GET(request)

    const mockQuery = mockSupabase.from.mock.results[0].value
    expect(mockQuery.eq).toHaveBeenCalledWith('subscription_tier', 'enterprise')
  })

  it('applies multiple filters', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    }))

    const request = new Request('http://localhost/api/organizations?search=test&status=active&tier=professional')
    await GET(request)

    const mockQuery = mockSupabase.from.mock.results[0].value
    expect(mockQuery.or).toHaveBeenCalled()
    expect(mockQuery.eq).toHaveBeenCalledWith('subscription_status', 'active')
    expect(mockQuery.eq).toHaveBeenCalledWith('subscription_tier', 'professional')
  })

  it('ignores "all" filters', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    }))

    const request = new Request('http://localhost/api/organizations?status=all&tier=all')
    await GET(request)

    const mockQuery = mockSupabase.from.mock.results[0].value
    // Should not call eq for "all" values
    expect(mockQuery.eq).not.toHaveBeenCalledWith('subscription_status', 'all')
    expect(mockQuery.eq).not.toHaveBeenCalledWith('subscription_tier', 'all')
  })

  it('orders by created_at desc', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    }))

    const request = new Request('http://localhost/api/organizations')
    await GET(request)

    const mockQuery = mockSupabase.from.mock.results[0].value
    expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('handles database error', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      }),
    }))

    const request = new Request('http://localhost/api/organizations')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toHaveProperty('error', 'Failed to fetch organizations')
  })

  it('handles internal server error', async () => {
    mockSupabase.from.mockImplementation(() => {
      throw new Error('Connection failed')
    })

    const request = new Request('http://localhost/api/organizations')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toHaveProperty('error', 'Internal server error')
  })

  it('transforms user and appointment counts correctly', async () => {
    const mockData = [
      {
        id: '1',
        name: 'Test Org',
        users: [{ count: 15 }],
        appointments: [{ count: 42 }],
      },
      {
        id: '2',
        name: 'Test Org 2',
        users: [],
        appointments: null,
      },
    ]

    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
        count: 2,
      }),
    }))

    const request = new Request('http://localhost/api/organizations')
    const response = await GET(request)
    const data = await response.json()

    expect(data.organizations[0].user_count).toBe(15)
    expect(data.organizations[0].appointment_count).toBe(42)
    expect(data.organizations[1].user_count).toBe(0)
    expect(data.organizations[1].appointment_count).toBe(0)
  })

  it('handles empty search string', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    }))

    const request = new Request('http://localhost/api/organizations?search=')
    await GET(request)

    const mockQuery = mockSupabase.from.mock.results[0].value
    // Should not apply search filter for empty string
    expect(mockQuery.or).not.toHaveBeenCalled()
  })
})
