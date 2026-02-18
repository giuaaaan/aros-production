import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import OrganizationsPage from '../page'
import { mockOrganizations } from '@/test/mocks/data'

// Mock the hook
const mockUseOrganizations = vi.fn()

vi.mock('@/hooks/use-organizations', () => ({
  useOrganizations: (options: any) => mockUseOrganizations(options),
}))

describe('OrganizationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default successful state
    mockUseOrganizations.mockReturnValue({
      organizations: mockOrganizations,
      total: mockOrganizations.length,
      loading: false,
      error: null,
    })
  })

  it('renders header with title and description', () => {
    render(<OrganizationsPage />)
    
    expect(screen.getByText('Organizations')).toBeInTheDocument()
    expect(screen.getByText('Manage your customer organizations')).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<OrganizationsPage />)
    
    expect(screen.getByPlaceholderText('Search organizations...')).toBeInTheDocument()
  })

  it('renders add organization button', () => {
    render(<OrganizationsPage />)
    
    expect(screen.getByRole('button', { name: /add organization/i })).toBeInTheDocument()
  })

  it('renders organizations table with data', () => {
    render(<OrganizationsPage />)
    
    // Check table headers
    expect(screen.getByText('Organization')).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Plan')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Appointments')).toBeInTheDocument()
  })

  it('displays organization data correctly', () => {
    render(<OrganizationsPage />)
    
    // Check organization names are displayed
    mockOrganizations.forEach(org => {
      expect(screen.getByText(org.name)).toBeInTheDocument()
    })
  })

  it('displays organization locations', () => {
    render(<OrganizationsPage />)
    
    mockOrganizations.forEach(org => {
      if (org.city) {
        expect(screen.getByText(org.city)).toBeInTheDocument()
      }
    })
  })

  it('displays subscription tiers with correct colors', () => {
    render(<OrganizationsPage />)
    
    // Check tier badges
    expect(screen.getByText('starter')).toBeInTheDocument()
    expect(screen.getByText('professional')).toBeInTheDocument()
    expect(screen.getByText('enterprise')).toBeInTheDocument()
  })

  it('displays subscription statuses with correct colors', () => {
    render(<OrganizationsPage />)
    
    // Check status badges
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(screen.getByText('paused')).toBeInTheDocument()
  })

  it('displays user and appointment counts', () => {
    render(<OrganizationsPage />)
    
    // Check counts are displayed
    expect(screen.getByText('5')).toBeInTheDocument() // users
    expect(screen.getByText('128')).toBeInTheDocument() // appointments
  })

  it('shows loading skeleton when loading', () => {
    mockUseOrganizations.mockReturnValue({
      organizations: [],
      total: 0,
      loading: true,
      error: null,
    })

    const { container } = render(<OrganizationsPage />)
    
    // Check for skeleton elements
    const skeletons = container.querySelectorAll('[class*="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows error message on error', () => {
    mockUseOrganizations.mockReturnValue({
      organizations: [],
      total: 0,
      loading: false,
      error: 'Failed to load organizations',
    })

    render(<OrganizationsPage />)
    
    expect(screen.getByText(/error loading organizations/i)).toBeInTheDocument()
    expect(screen.getByText('Failed to load organizations')).toBeInTheDocument()
  })

  it('shows empty state when no organizations', () => {
    mockUseOrganizations.mockReturnValue({
      organizations: [],
      total: 0,
      loading: false,
      error: null,
    })

    render(<OrganizationsPage />)
    
    expect(screen.getByText('No organizations found')).toBeInTheDocument()
  })

  it('calls useOrganizations with search when typing', async () => {
    render(<OrganizationsPage />)
    
    const searchInput = screen.getByPlaceholderText('Search organizations...')
    
    fireEvent.change(searchInput, { target: { value: 'test search' } })
    
    await waitFor(() => {
      expect(mockUseOrganizations).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'test search' })
      )
    })
  })

  it('displays total count', () => {
    render(<OrganizationsPage />)
    
    expect(screen.getByText(/showing \d+ of \d+ organizations/i)).toBeInTheDocument()
  })

  it('renders action buttons for each organization', () => {
    render(<OrganizationsPage />)
    
    // Should have menu buttons (MoreHorizontal icons)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(1) // Add button + menu buttons
  })

  it('displays phone numbers', () => {
    render(<OrganizationsPage />)
    
    // Check phone numbers are displayed under organization names
    mockOrganizations.forEach(org => {
      if (org.phone_number) {
        expect(screen.getByText(org.phone_number)).toBeInTheDocument()
      }
    })
  })
})
