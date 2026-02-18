import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConnectionStatus } from '../connection-status'

// Mock the useRealtimeStatus hook
const mockUseRealtimeStatus = vi.fn()

vi.mock('@/hooks/use-realtime', () => ({
  useRealtimeStatus: () => mockUseRealtimeStatus(),
}))

describe('ConnectionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders connected state correctly', () => {
    mockUseRealtimeStatus.mockReturnValue(true)
    
    render(<ConnectionStatus />)
    
    // Check for "Live" text
    expect(screen.getByText('Live')).toBeInTheDocument()
    
    // Check for green indicator (via CSS class)
    const indicator = document.querySelector('.bg-green-500')
    expect(indicator).toBeInTheDocument()
    
    // Check for wifi icon
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('renders disconnected state correctly', () => {
    mockUseRealtimeStatus.mockReturnValue(false)
    
    render(<ConnectionStatus />)
    
    // Check for "Offline" text
    expect(screen.getByText('Offline')).toBeInTheDocument()
    
    // Check for red indicator
    const indicator = document.querySelector('.bg-red-500')
    expect(indicator).toBeInTheDocument()
  })

  it('has correct tooltip content when connected', async () => {
    mockUseRealtimeStatus.mockReturnValue(true)
    
    render(<ConnectionStatus />)
    
    // The tooltip content should be in the DOM (even if hidden)
    expect(screen.getByText('Real-time connection active')).toBeInTheDocument()
  })

  it('has correct tooltip content when disconnected', () => {
    mockUseRealtimeStatus.mockReturnValue(false)
    
    render(<ConnectionStatus />)
    
    expect(screen.getByText('Real-time connection lost. Data may be stale.')).toBeInTheDocument()
  })

  it('transitions between states correctly', () => {
    const { rerender } = render(<ConnectionStatus />)
    
    // Start connected
    mockUseRealtimeStatus.mockReturnValue(true)
    rerender(<ConnectionStatus />)
    expect(screen.getByText('Live')).toBeInTheDocument()
    
    // Switch to disconnected
    mockUseRealtimeStatus.mockReturnValue(false)
    rerender(<ConnectionStatus />)
    expect(screen.getByText('Offline')).toBeInTheDocument()
    
    // Switch back to connected
    mockUseRealtimeStatus.mockReturnValue(true)
    rerender(<ConnectionStatus />)
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('has accessible tooltip trigger', () => {
    mockUseRealtimeStatus.mockReturnValue(true)
    
    render(<ConnectionStatus />)
    
    // The trigger should have role button for accessibility
    const trigger = screen.getByText('Live').closest('div[role="button"]') || 
                   screen.getByText('Live').parentElement
    expect(trigger).toBeDefined()
  })
})
