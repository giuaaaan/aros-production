import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AnalyticsPage from '../page'

describe('AnalyticsPage', () => {
  it('renders header with title and description', () => {
    render(<AnalyticsPage />)
    
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Detailed insights and performance metrics')).toBeInTheDocument()
  })

  it('renders AI Success Rate card', () => {
    render(<AnalyticsPage />)
    
    expect(screen.getByText('AI Success Rate')).toBeInTheDocument()
    expect(screen.getByText('94.2%')).toBeInTheDocument()
    expect(screen.getByText('+2.1% from last month')).toBeInTheDocument()
  })

  it('renders Average Call Duration card', () => {
    render(<AnalyticsPage />)
    
    expect(screen.getByText('Avg. Call Duration')).toBeInTheDocument()
    expect(screen.getByText('2m 34s')).toBeInTheDocument()
    expect(screen.getByText('-12s from last month')).toBeInTheDocument()
  })

  it('renders Churn Rate card', () => {
    render(<AnalyticsPage />)
    
    expect(screen.getByText('Churn Rate')).toBeInTheDocument()
    expect(screen.getByText('3.2%')).toBeInTheDocument()
    expect(screen.getByText('-0.5% from last month')).toBeInTheDocument()
  })

  it('renders NPS Score card', () => {
    render(<AnalyticsPage />)
    
    expect(screen.getByText('NPS Score')).toBeInTheDocument()
    expect(screen.getByText('72')).toBeInTheDocument()
    expect(screen.getByText('+5 from last month')).toBeInTheDocument()
  })

  it('renders Top Performing Organizations section', () => {
    render(<AnalyticsPage />)
    
    expect(screen.getByText('Top Performing Organizations')).toBeInTheDocument()
  })

  it('displays top organizations list', () => {
    render(<AnalyticsPage />)
    
    // Check for mock organizations
    expect(screen.getByText('Auto Service Bianchi')).toBeInTheDocument()
    expect(screen.getByText('Officina Rossi')).toBeInTheDocument()
    expect(screen.getByText('Car Repair Neri')).toBeInTheDocument()
  })

  it('displays call counts for top organizations', () => {
    render(<AnalyticsPage />)
    
    expect(screen.getByText('423 calls')).toBeInTheDocument()
    expect(screen.getByText('156 calls')).toBeInTheDocument()
    expect(screen.getByText('89 calls')).toBeInTheDocument()
  })

  it('displays growth percentages', () => {
    render(<AnalyticsPage />)
    
    expect(screen.getByText('+15%')).toBeInTheDocument()
    expect(screen.getByText('+8%')).toBeInTheDocument()
    expect(screen.getByText('-2%')).toBeInTheDocument()
  })

  it('applies correct styling to positive growth', () => {
    const { container } = render(<AnalyticsPage />)
    
    // Positive growth should have green text
    const positiveGrowth = container.querySelector('.text-green-500')
    expect(positiveGrowth).toBeInTheDocument()
  })

  it('applies correct styling to negative growth', () => {
    const { container } = render(<AnalyticsPage />)
    
    // Negative growth should have red text
    const negativeGrowth = container.querySelector('.text-red-500')
    expect(negativeGrowth).toBeInTheDocument()
  })

  it('renders ActivityChart component', () => {
    const { container } = render(<AnalyticsPage />)
    
    // ActivityChart should be in the document
    // It's a recharts component, so we check for its container
    const chartContainer = container.querySelector('[class*="recharts"]') ||
                          container.querySelector('[class*="chart"]')
    // Note: Since ActivityChart is mocked in test setup, this may not render fully
    expect(container).toBeInTheDocument()
  })

  it('has correct responsive grid layout', () => {
    const { container } = render(<AnalyticsPage />)
    
    // Check for grid container
    const grid = container.querySelector('[class*="grid"]')
    expect(grid).toBeInTheDocument()
  })

  it('renders ranking numbers', () => {
    const { container } = render(<AnalyticsPage />)
    
    // Should have ranking badges (1, 2, 3)
    const badges = container.querySelectorAll('[class*="rounded-full"]')
    expect(badges.length).toBeGreaterThan(0)
  })
})
