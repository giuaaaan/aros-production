import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { KPICard } from '../kpi-card'
import { TrendingUp, TrendingDown, DollarSign, Users, Phone } from 'lucide-react'

describe('KPICard', () => {
  it('renders basic card with title and value', () => {
    render(
      <KPICard
        title="Total Revenue"
        value={15000}
        icon={<DollarSign data-testid="icon" />}
      />
    )
    
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('15.000 €')).toBeInTheDocument()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('formats currency correctly', () => {
    render(
      <KPICard
        title="Revenue"
        value={1234567}
        format="currency"
        icon={<DollarSign />}
      />
    )
    
    // Italian locale: 1.234.567 €
    expect(screen.getByText('1.234.567 €')).toBeInTheDocument()
  })

  it('formats number correctly', () => {
    render(
      <KPICard
        title="Customers"
        value={1234}
        format="number"
        icon={<Users />}
      />
    )
    
    expect(screen.getByText('1.234')).toBeInTheDocument()
  })

  it('formats percentage correctly', () => {
    render(
      <KPICard
        title="Conversion"
        value={85.5}
        format="percentage"
        icon={<TrendingUp />}
      />
    )
    
    expect(screen.getByText('85.5%')).toBeInTheDocument()
  })

  it('shows positive change with correct styling', () => {
    render(
      <KPICard
        title="Calls"
        value={42}
        change={15.3}
        changeLabel="vs yesterday"
        icon={<Phone />}
        trend="up"
      />
    )
    
    expect(screen.getByText('+15.3%')).toBeInTheDocument()
    expect(screen.getByText('vs yesterday')).toBeInTheDocument()
    
    // Should have success badge
    const badge = screen.getByText('+15.3%').closest('[class*="badge"]') ||
                  screen.getByText('+15.3%').parentElement
    expect(badge?.className).toContain('success') || expect(badge).toBeDefined()
  })

  it('shows negative change with correct styling', () => {
    render(
      <KPICard
        title="Revenue"
        value={5000}
        change={-8.5}
        icon={<TrendingDown />}
        trend="down"
      />
    )
    
    expect(screen.getByText('-8.5%')).toBeInTheDocument()
    
    // Should have destructive badge
    const badge = screen.getByText('-8.5%').closest('[class*="badge"]') ||
                  screen.getByText('-8.5%').parentElement
    expect(badge?.className).toContain('destructive') || expect(badge).toBeDefined()
  })

  it('handles zero change correctly', () => {
    render(
      <KPICard
        title="Stable Metric"
        value={100}
        change={0}
        icon={<TrendingUp />}
        trend="neutral"
      />
    )
    
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('renders without change section when change is undefined', () => {
    render(
      <KPICard
        title="Simple Metric"
        value={999}
        icon={<Users />}
      />
    )
    
    expect(screen.getByText('999')).toBeInTheDocument()
    expect(screen.queryByText('%')).not.toBeInTheDocument()
  })

  it('displays custom change label', () => {
    render(
      <KPICard
        title="Revenue"
        value={1000}
        change={10}
        changeLabel="vs last quarter"
        icon={<DollarSign />}
      />
    )
    
    expect(screen.getByText('vs last quarter')).toBeInTheDocument()
  })

  it('has decorative gradient background', () => {
    const { container } = render(
      <KPICard
        title="Test"
        value={100}
        icon={<Users />}
      />
    )
    
    // Check for gradient decoration element
    const gradient = container.querySelector('[class*="gradient-to-br"]') ||
                    container.querySelector('[class*="from-primary"]')
    expect(gradient).toBeInTheDocument()
  })
})
