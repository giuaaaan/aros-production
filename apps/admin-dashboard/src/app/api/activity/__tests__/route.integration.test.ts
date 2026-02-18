import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { createAdminClient } from '@/lib/supabase/server'

// Mock the server client
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}))

describe('GET /api/activity', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createAdminClient as any).mockReturnValue(mockSupabase)
  })

  it('returns combined activity list', async () => {
    const mockConversations = [
      {
        id: '1',
        channel: 'voice',
        status: 'completed',
        created_at: '2024-01-15T10:00:00Z',
        organizations: { name: 'Test Org 1' },
      },
      {
        id: '2',
        channel: 'whatsapp',
        status: 'active',
        created_at: '2024-01-15T09:30:00Z',
        organizations: { name: 'Test Org 2' },
      },
    ]

    const mockAppointments = [
      {
        id: '1',
        source: 'ai_voice',
        status: 'confirmed',
        created_at: '2024-01-15T09:00:00Z',
        organizations: { name: 'Test Org 3' },
      },
    ]

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockConversations }),
        }
      }
      if (table === 'appointments') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockAppointments }),
        }
      }
      return mockSupabase
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(3) // 2 conversations + 1 appointment
  })

  it('transforms voice conversations to call activities', async () => {
    const mockConversations = [
      {
        id: '1',
        channel: 'voice',
        status: 'completed',
        created_at: '2024-01-15T10:00:00Z',
        organizations: { name: 'Voice Org' },
      },
    ]

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockConversations }),
        }
      }
      if (table === 'appointments') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [] }),
        }
      }
      return mockSupabase
    })

    const response = await GET()
    const data = await response.json()

    expect(data[0]).toMatchObject({
      id: 'conv-1',
      type: 'call',
      organization: 'Voice Org',
      description: 'AI voice call completed',
    })
  })

  it('transforms whatsapp conversations correctly', async () => {
    const mockConversations = [
      {
        id: '1',
        channel: 'whatsapp',
        status: 'active',
        created_at: '2024-01-15T10:00:00Z',
        organizations: { name: 'WhatsApp Org' },
      },
    ]

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockConversations }),
        }
      }
      if (table === 'appointments') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [] }),
        }
      }
      return mockSupabase
    })

    const response = await GET()
    const data = await response.json()

    expect(data[0]).toMatchObject({
      id: 'conv-1',
      type: 'whatsapp',
      organization: 'WhatsApp Org',
      description: 'WhatsApp conversation handled',
    })
  })

  it('transforms ai_voice appointments correctly', async () => {
    const mockAppointments = [
      {
        id: '1',
        source: 'ai_voice',
        status: 'confirmed',
        created_at: '2024-01-15T10:00:00Z',
        organizations: { name: 'Voice Apt Org' },
      },
    ]

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [] }),
        }
      }
      if (table === 'appointments') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockAppointments }),
        }
      }
      return mockSupabase
    })

    const response = await GET()
    const data = await response.json()

    expect(data[0]).toMatchObject({
      id: 'apt-1',
      type: 'appointment',
      organization: 'Voice Apt Org',
      description: 'Appointment booked via AI voice',
    })
  })

  it('transforms ai_whatsapp appointments correctly', async () => {
    const mockAppointments = [
      {
        id: '1',
        source: 'ai_whatsapp',
        status: 'confirmed',
        created_at: '2024-01-15T10:00:00Z',
        organizations: { name: 'WhatsApp Apt Org' },
      },
    ]

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [] }),
        }
      }
      if (table === 'appointments') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockAppointments }),
        }
      }
      return mockSupabase
    })

    const response = await GET()
    const data = await response.json()

    expect(data[0]).toMatchObject({
      id: 'apt-1',
      type: 'appointment',
      organization: 'WhatsApp Apt Org',
      description: 'Appointment booked via WhatsApp',
    })
  })

  it('handles unknown appointment sources', async () => {
    const mockAppointments = [
      {
        id: '1',
        source: 'manual',
        status: 'confirmed',
        created_at: '2024-01-15T10:00:00Z',
        organizations: { name: 'Manual Org' },
      },
    ]

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [] }),
        }
      }
      if (table === 'appointments') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockAppointments }),
        }
      }
      return mockSupabase
    })

    const response = await GET()
    const data = await response.json()

    expect(data[0]).toMatchObject({
      type: 'signup',
      description: 'New appointment created',
    })
  })

  it('handles missing organization names', async () => {
    const mockConversations = [
      {
        id: '1',
        channel: 'voice',
        status: 'completed',
        created_at: '2024-01-15T10:00:00Z',
        organizations: null,
      },
    ]

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockConversations }),
        }
      }
      if (table === 'appointments') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [] }),
        }
      }
      return mockSupabase
    })

    const response = await GET()
    const data = await response.json()

    expect(data[0].organization).toBe('Unknown')
  })

  it('returns empty array when no data', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [] }),
        }
      }
      if (table === 'appointments') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [] }),
        }
      }
      return mockSupabase
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })

  it('limits results to 10 items', async () => {
    const manyConversations = Array(20).fill(null).map((_, i) => ({
      id: `${i}`,
      channel: 'voice',
      status: 'completed',
      created_at: `2024-01-${15 - i}T10:00:00Z`,
      organizations: { name: `Org ${i}` },
    }))

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: manyConversations.slice(0, 10) }),
        }
      }
      if (table === 'appointments') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [] }),
        }
      }
      return mockSupabase
    })

    const response = await GET()
    const data = await response.json()

    expect(data.length).toBeLessThanOrEqual(10)
  })

  it('returns 500 on database error', async () => {
    mockSupabase.from.mockImplementation(() => {
      throw new Error('Database connection failed')
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toHaveProperty('error', 'Failed to fetch activity')
  })

  it('sorts activities by timestamp descending', async () => {
    const mockConversations = [
      {
        id: '1',
        channel: 'voice',
        status: 'completed',
        created_at: '2024-01-15T08:00:00Z', // Earliest
        organizations: { name: 'Early Org' },
      },
    ]

    const mockAppointments = [
      {
        id: '1',
        source: 'ai_voice',
        status: 'confirmed',
        created_at: '2024-01-15T10:00:00Z', // Latest
        organizations: { name: 'Late Org' },
      },
    ]

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockConversations }),
        }
      }
      if (table === 'appointments') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockAppointments }),
        }
      }
      return mockSupabase
    })

    const response = await GET()
    const data = await response.json()

    // Latest should be first
    expect(data[0].organization).toBe('Late Org')
    expect(data[1].organization).toBe('Early Org')
  })
})
