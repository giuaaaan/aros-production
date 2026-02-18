import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatsCards } from '../stats-cards'

describe('StatsCards', () => {
  it('renders all stats correctly', () => {
    render(
      <StatsCards 
        todayAppointments={5}
        successfulCalls={12}
        whatsappChats={8}
      />
    )
    
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('displays correct labels', () => {
    render(
      <StatsCards 
        todayAppointments={3}
        successfulCalls={7}
        whatsappChats={4}
      />
    )
    
    expect(screen.getByText(/appuntamenti oggi/i)).toBeInTheDocument()
    expect(screen.getByText(/chiamate gestite/i)).toBeInTheDocument()
    expect(screen.getByText(/chat whatsapp/i)).toBeInTheDocument()
  })

  it('handles zero values', () => {
    render(
      <StatsCards 
        todayAppointments={0}
        successfulCalls={0}
        whatsappChats={0}
      />
    )
    
    const zeros = screen.getAllByText('0')
    expect(zeros).toHaveLength(3)
  })
})
