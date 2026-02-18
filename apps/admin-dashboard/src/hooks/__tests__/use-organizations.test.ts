import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useOrganizations } from '../use-organizations'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useOrganizations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches organizations on mount', async () => {
    const mockData = {
      organizations: [
        { id: '1', name: 'Org 1', subscription_status: 'active' },
        { id: '2', name: 'Org 2', subscription_status: 'paused' },
      ],
      total: 2,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const { result } = renderHook(() => useOrganizations())

    // Initially loading
    expect(result.current.loading).toBe(true)

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.organizations).toHaveLength(2)
    expect(result.current.total).toBe(2)
    expect(result.current.error).toBeNull()
  })

  it('handles search parameter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ organizations: [], total: 0 }),
    })

    renderHook(() => useOrganizations({ search: 'test' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/organizations?search=test')
    })
  })

  it('handles status filter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ organizations: [], total: 0 }),
    })

    renderHook(() => useOrganizations({ status: 'active' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/organizations?status=active')
    })
  })

  it('handles tier filter', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ organizations: [], total: 0 }),
    })

    renderHook(() => useOrganizations({ tier: 'professional' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/organizations?tier=professional')
    })
  })

  it('combines multiple filters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ organizations: [], total: 0 }),
    })

    renderHook(() => useOrganizations({ 
      search: 'test', 
      status: 'active', 
      tier: 'enterprise' 
    }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/organizations?')
      )
    })

    const callUrl = mockFetch.mock.calls[0][0]
    expect(callUrl).toContain('search=test')
    expect(callUrl).toContain('status=active')
    expect(callUrl).toContain('tier=enterprise')
  })

  it('handles API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useOrganizations())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch organizations')
    expect(result.current.organizations).toEqual([])
  })

  it('handles network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useOrganizations())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })

  it('handles unknown error type', async () => {
    mockFetch.mockRejectedValueOnce('Unknown error')

    const { result } = renderHook(() => useOrganizations())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Unknown error')
  })

  it('refetches when search changes', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ organizations: [], total: 0 }),
    })

    const { rerender } = renderHook(
      ({ search }) => useOrganizations({ search }),
      { initialProps: { search: '' } }
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    // Change search
    rerender({ search: 'new search' })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch).toHaveBeenLastCalledWith('/api/organizations?search=new+search')
    })
  })

  it('refetches when status changes', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ organizations: [], total: 0 }),
    })

    const { rerender } = renderHook(
      ({ status }) => useOrganizations({ status }),
      { initialProps: { status: 'all' } }
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    // Change status
    rerender({ status: 'active' })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  it('does not include "all" filters in URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ organizations: [], total: 0 }),
    })

    renderHook(() => useOrganizations({ 
      status: 'all', 
      tier: 'all' 
    }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/organizations')
    })
  })

  it('returns correct initial state', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ organizations: [], total: 0 }),
    })

    const { result } = renderHook(() => useOrganizations())

    expect(result.current.organizations).toEqual([])
    expect(result.current.total).toBe(0)
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })
})
