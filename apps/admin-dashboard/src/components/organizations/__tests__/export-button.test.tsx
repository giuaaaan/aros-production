import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportButton, ExportAllButton } from '../export-button';
import { Organization } from '@/types';

// Mock fetch
global.fetch = vi.fn();

describe('ExportButton', () => {
  const mockOrganizations: Organization[] = [
    {
      id: '1',
      name: 'Test Org 1',
      phone_number: '+39123456789',
      email: 'test@example.com',
      address: 'Via Roma 1',
      city: 'Rome',
      postal_code: '00100',
      subscription_tier: 'professional',
      subscription_status: 'active',
      user_count: 5,
      appointment_count: 10,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders export button', () => {
    render(
      <ExportButton
        organizations={mockOrganizations}
        disabled={false}
      />
    );
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('is disabled when no organizations', () => {
    render(
      <ExportButton
        organizations={[]}
        disabled={false}
      />
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when loading prop is true', () => {
    render(
      <ExportButton
        organizations={mockOrganizations}
        disabled={true}
      />
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('triggers download when clicked', async () => {
    const mockClick = vi.fn();
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
    };
    
    const originalCreateElement = document.createElement;
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'a') return mockAnchor as any;
      return originalCreateElement.call(document, tagName);
    }) as any;

    URL.createObjectURL = vi.fn(() => 'mock-url');
    URL.revokeObjectURL = vi.fn();

    render(
      <ExportButton
        organizations={mockOrganizations}
        disabled={false}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    // Restore
    document.createElement = originalCreateElement;
  });
});

describe('ExportAllButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  it('renders export all button with count', () => {
    render(
      <ExportAllButton
        filters={{}}
        totalCount={150}
      />
    );
    expect(screen.getByText('Export All (150)')).toBeInTheDocument();
  });

  it('is disabled when total count is 0', () => {
    render(
      <ExportAllButton
        filters={{}}
        totalCount={0}
      />
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('fetches and exports all organizations', async () => {
    const mockOrganizations = [
      {
        id: '1',
        name: 'Test Org',
        phone_number: '+39123456789',
        subscription_tier: 'professional',
        subscription_status: 'active',
        user_count: 5,
        appointment_count: 10,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ organizations: mockOrganizations }),
    });

    const mockClick = vi.fn();
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
    };
    
    const originalCreateElement = document.createElement;
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'a') return mockAnchor as any;
      return originalCreateElement.call(document, tagName);
    }) as any;

    URL.createObjectURL = vi.fn(() => 'mock-url');
    URL.revokeObjectURL = vi.fn();

    render(
      <ExportAllButton
        filters={{ search: 'test', status: 'active' }}
        totalCount={1}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/organizations/export')
      );
    });

    // Restore
    document.createElement = originalCreateElement;
  });
});
