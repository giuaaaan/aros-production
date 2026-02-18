import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useRealtime, useRealtimeStatus, useRealtimeActivity } from '../use-realtime'

// Mock Supabase
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn(),
}

const mockRemoveChannel = vi.fn()
const mockSupabaseClient = {
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: mockRemoveChannel,
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

describe('useRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with disconnected state', () => {
    mockChannel.subscribe.mockImplementation((callback) => {
      callback('SUBSCRIBED')
      return { unsubscribe: vi.fn() }
    })

    const onData = vi.fn()
    const { result } = renderHook(() =>
      useRealtime({
        channel: 'test-channel',
        table: 'test_table',
        onData,
      })
    )

    expect(result.current.isConnected).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('handles subscription error', () => {
    mockChannel.subscribe.mockImplementation((callback) => {
      callback('CHANNEL_ERROR')
      return { unsubscribe: vi.fn() }
    })

    const onData = vi.fn()
    const { result } = renderHook(() =>
      useRealtime({
        channel: 'test-channel',
        table: 'test_table',
        onData,
      })
    )

    expect(result.current.isConnected).toBe(false)
    expect(result.current.error).toBe('Connection lost')
  })

  it('handles closed connection', () => {
    mockChannel.subscribe.mockImplementation((callback) => {
      callback('CLOSED')
      return { unsubscribe: vi.fn() }
    })

    const onData = vi.fn()
    const { result } = renderHook(() =>
      useRealtime({
        channel: 'test-channel',
        table: 'test_table',
        onData,
      })
    )

    expect(result.current.isConnected).toBe(false)
    expect(result.current.error).toBe('Connection lost')
  })

  it('calls onData when receiving payload', () => {
    const mockPayload = { new: { id: 1, name: 'Test' } }
    let payloadCallback: Function

    mockChannel.on.mockImplementation((event, config, callback) => {
      payloadCallback = callback
      return mockChannel
    })

    mockChannel.subscribe.mockImplementation(() => ({
      unsubscribe: vi.fn(),
    }))

    const onData = vi.fn()
    renderHook(() =>
      useRealtime({
        channel: 'test-channel',
        table: 'test_table',
        onData,
      })
    )

    // Simulate receiving data
    act(() => {
      payloadCallback(mockPayload)
    })

    expect(onData).toHaveBeenCalledWith(mockPayload)
  })

  it('cleans up subscription on unmount', () => {
    mockChannel.subscribe.mockImplementation(() => ({
      unsubscribe: vi.fn(),
    }))

    const onData = vi.fn()
    const { unmount } = renderHook(() =>
      useRealtime({
        channel: 'test-channel',
        table: 'test_table',
        onData,
      })
    )

    unmount()

    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel)
  })

  it('supports custom schema', () => {
    mockChannel.subscribe.mockImplementation((callback) => {
      callback('SUBSCRIBED')
      return { unsubscribe: vi.fn() }
    })

    const onData = vi.fn()
    renderHook(() =>
      useRealtime({
        channel: 'test-channel',
        table: 'test_table',
        schema: 'custom_schema',
        onData,
      })
    )

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ schema: 'custom_schema' }),
      expect.any(Function)
    )
  })

  it('supports filter option', () => {
    mockChannel.subscribe.mockImplementation((callback) => {
      callback('SUBSCRIBED')
      return { unsubscribe: vi.fn() }
    })

    const onData = vi.fn()
    renderHook(() =>
      useRealtime({
        channel: 'test-channel',
        table: 'test_table',
        filter: 'id=eq.123',
        onData,
      })
    )

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ filter: 'id=eq.123' }),
      expect.any(Function)
    )
  })
})

describe('useRealtimeStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns connection status', () => {
    mockChannel.subscribe.mockImplementation((callback) => {
      callback('SUBSCRIBED')
      return { unsubscribe: vi.fn() }
    })

    const { result } = renderHook(() => useRealtimeStatus())

    expect(result.current).toBe(true)
  })

  it('returns false when not subscribed', () => {
    mockChannel.subscribe.mockImplementation((callback) => {
      callback('CLOSED')
      return { unsubscribe: vi.fn() }
    })

    const { result } = renderHook(() => useRealtimeStatus())

    expect(result.current).toBe(false)
  })

  it('uses connection-check channel', () => {
    mockChannel.subscribe.mockImplementation((callback) => {
      callback('SUBSCRIBED')
      return { unsubscribe: vi.fn() }
    })

    renderHook(() => useRealtimeStatus())

    expect(mockSupabaseClient.channel).toHaveBeenCalledWith('connection-check')
  })
})

describe('useRealtimeActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty activities', () => {
    mockChannel.subscribe.mockImplementation((callback) => {
      callback('SUBSCRIBED')
      return { unsubscribe: vi.fn() }
    })

    const onNewActivity = vi.fn()
    const { result } = renderHook(() => useRealtimeActivity(onNewActivity))

    expect(result.current.activities).toEqual([])
    expect(result.current.isConnected).toBe(true)
  })

  it('transforms voice channel to call activity', () => {
    let payloadCallback: Function

    mockChannel.on.mockImplementation((event, config, callback) => {
      payloadCallback = callback
      return mockChannel
    })

    mockChannel.subscribe.mockImplementation(() => ({
      unsubscribe: vi.fn(),
    }))

    const onNewActivity = vi.fn()
    const { result } = renderHook(() => useRealtimeActivity(onNewActivity))

    // Simulate voice conversation insert
    act(() => {
      payloadCallback({
        new: { id: '123', channel: 'voice', created_at: '2024-01-01T00:00:00Z' },
      })
    })

    expect(onNewActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'call',
        description: 'AI voice call started',
      })
    )

    expect(result.current.activities[0]).toMatchObject({
      type: 'call',
      description: 'AI voice call started',
    })
  })

  it('transforms whatsapp channel to whatsapp activity', () => {
    let payloadCallback: Function

    mockChannel.on.mockImplementation((event, config, callback) => {
      payloadCallback = callback
      return mockChannel
    })

    mockChannel.subscribe.mockImplementation(() => ({
      unsubscribe: vi.fn(),
    }))

    const onNewActivity = vi.fn()
    const { result } = renderHook(() => useRealtimeActivity(onNewActivity))

    // Simulate whatsapp conversation insert
    act(() => {
      payloadCallback({
        new: { id: '456', channel: 'whatsapp', created_at: '2024-01-01T00:00:00Z' },
      })
    })

    expect(onNewActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'whatsapp',
        description: 'WhatsApp message received',
      })
    )

    expect(result.current.activities[0]).toMatchObject({
      type: 'whatsapp',
      description: 'WhatsApp message received',
    })
  })

  it('maintains max 10 activities', () => {
    let payloadCallback: Function

    mockChannel.on.mockImplementation((event, config, callback) => {
      payloadCallback = callback
      return mockChannel
    })

    mockChannel.subscribe.mockImplementation(() => ({
      unsubscribe: vi.fn(),
    }))

    const onNewActivity = vi.fn()
    const { result } = renderHook(() => useRealtimeActivity(onNewActivity))

    // Add 15 activities
    act(() => {
      for (let i = 0; i < 15; i++) {
        payloadCallback({
          new: { id: `${i}`, channel: 'voice', created_at: '2024-01-01T00:00:00Z' },
        })
      }
    })

    expect(result.current.activities.length).toBe(10)
  })

  it('prepends new activities to the list', () => {
    let payloadCallback: Function

    mockChannel.on.mockImplementation((event, config, callback) => {
      payloadCallback = callback
      return mockChannel
    })

    mockChannel.subscribe.mockImplementation(() => ({
      unsubscribe: vi.fn(),
    }))

    const onNewActivity = vi.fn()
    const { result } = renderHook(() => useRealtimeActivity(onNewActivity))

    // Add two activities
    act(() => {
      payloadCallback({
        new: { id: '1', channel: 'voice', created_at: '2024-01-01T00:00:00Z' },
      })
    })

    act(() => {
      payloadCallback({
        new: { id: '2', channel: 'whatsapp', created_at: '2024-01-02T00:00:00Z' },
      })
    })

    // Most recent should be first
    expect(result.current.activities[0].id).toBe('conv-2')
    expect(result.current.activities[1].id).toBe('conv-1')
  })

  it('uses admin-activity channel', () => {
    mockChannel.subscribe.mockImplementation((callback) => {
      callback('SUBSCRIBED')
      return { unsubscribe: vi.fn() }
    })

    const onNewActivity = vi.fn()
    renderHook(() => useRealtimeActivity(onNewActivity))

    expect(mockSupabaseClient.channel).toHaveBeenCalledWith('admin-activity')
  })
})
