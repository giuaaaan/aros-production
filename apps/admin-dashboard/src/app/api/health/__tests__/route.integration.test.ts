import { describe, it, expect, vi } from 'vitest'
import { GET, HEAD } from '../route'
import { createAdminClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}))

describe('Health Check API', () => {
  it('returns healthy status when all checks pass', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }
    ;(createAdminClient as any).mockReturnValue(mockSupabase)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.checks.database.status).toBe('up')
    expect(data.checks.uptime.status).toBe('up')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('version')
    expect(data).toHaveProperty('environment')
  })

  it('returns unhealthy status when database is down', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ 
            error: { message: 'Connection refused' } 
          }),
        })),
      })),
    }
    ;(createAdminClient as any).mockReturnValue(mockSupabase)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('unhealthy')
    expect(data.checks.database.status).toBe('down')
    expect(data.checks.database.message).toBe('Connection refused')
  })

  it('returns degraded status on memory pressure', async () => {
    // Mock memory usage at 85%
    const originalMemoryUsage = process.memoryUsage
    process.memoryUsage = vi.fn(() => ({
      heapUsed: 850 * 1024 * 1024,
      heapTotal: 1000 * 1024 * 1024,
      rss: 1000 * 1024 * 1024,
      external: 0,
      arrayBuffers: 0,
    } as NodeJS.MemoryUsage))

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }
    ;(createAdminClient as any).mockReturnValue(mockSupabase)

    const response = await GET()
    const data = await response.json()

    expect(data.status).toBe('degraded')
    expect(data.checks.memory.status).toBe('down')

    // Restore
    process.memoryUsage = originalMemoryUsage
  })

  it('includes latency information for database', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }
    ;(createAdminClient as any).mockReturnValue(mockSupabase)

    const response = await GET()
    const data = await response.json()

    expect(data.checks.database.latency).toBeGreaterThanOrEqual(0)
    expect(data.checks.database.latency).toBeLessThan(1000) // Should be fast in tests
  })

  it('returns no-cache headers', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }
    ;(createAdminClient as any).mockReturnValue(mockSupabase)

    const response = await GET()

    expect(response.headers.get('Cache-Control')).toContain('no-cache')
  })

  it('HEAD request returns simple 200', async () => {
    const response = await HEAD()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toContain('no-cache')
  })

  it('includes memory usage information', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }
    ;(createAdminClient as any).mockReturnValue(mockSupabase)

    const response = await GET()
    const data = await response.json()

    expect(data.checks.memory).toHaveProperty('usage')
    expect(data.checks.memory).toHaveProperty('limit')
    expect(data.checks.memory.usage).toMatch(/\d+MB/)
    expect(data.checks.memory.limit).toMatch(/\d+MB/)
  })

  it('tracks uptime correctly', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }
    ;(createAdminClient as any).mockReturnValue(mockSupabase)

    const response = await GET()
    const data = await response.json()

    expect(data.checks.uptime.seconds).toBeGreaterThanOrEqual(0)
  })

  it('includes metadata when available', async () => {
    // Set env vars
    process.env.VERCEL_REGION = 'fra1'
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA = 'abc123'

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    }
    ;(createAdminClient as any).mockReturnValue(mockSupabase)

    const response = await GET()
    const data = await response.json()

    expect(data.metadata).toBeDefined()
  })
})
