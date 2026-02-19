import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrganizationFiltersPanel, OrganizationFilters } from '../filters';

describe('OrganizationFiltersPanel', () => {
  const defaultFilters: OrganizationFilters = {
    search: '',
    status: 'all',
    tier: 'all',
    city: '',
  };

  it('renders search input', () => {
    render(
      <OrganizationFiltersPanel
        filters={defaultFilters}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText('Search organizations...')).toBeInTheDocument();
  });

  it('renders filter selects', () => {
    render(
      <OrganizationFiltersPanel
        filters={defaultFilters}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText('Filters:')).toBeInTheDocument();
  });

  it('calls onChange when search input changes', () => {
    const onChange = vi.fn();
    render(
      <OrganizationFiltersPanel
        filters={defaultFilters}
        onChange={onChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search organizations...');
    fireEvent.change(searchInput, { target: { value: 'Test Org' } });

    expect(onChange).toHaveBeenCalledWith({
      ...defaultFilters,
      search: 'Test Org',
    });
  });

  it('calls onChange when city input changes', () => {
    const onChange = vi.fn();
    render(
      <OrganizationFiltersPanel
        filters={defaultFilters}
        onChange={onChange}
      />
    );

    const cityInput = screen.getByPlaceholderText('Filter by city...');
    fireEvent.change(cityInput, { target: { value: 'Rome' } });

    expect(onChange).toHaveBeenCalledWith({
      ...defaultFilters,
      city: 'Rome',
    });
  });

  it('shows clear filters button when filters are active', () => {
    render(
      <OrganizationFiltersPanel
        filters={{ ...defaultFilters, status: 'active' }}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Clear filters')).toBeInTheDocument();
  });

  it('does not show clear filters button when no filters are active', () => {
    render(
      <OrganizationFiltersPanel
        filters={defaultFilters}
        onChange={vi.fn()}
      />
    );

    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();
  });

  it('shows active filter pills when filters are applied', () => {
    render(
      <OrganizationFiltersPanel
        filters={{ ...defaultFilters, status: 'active', search: 'Test' }}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Active:')).toBeInTheDocument();
    expect(screen.getByText('Status: active')).toBeInTheDocument();
    expect(screen.getByText('Search: "Test"')).toBeInTheDocument();
  });

  it('resets all filters when clear button is clicked', () => {
    const onChange = vi.fn();
    render(
      <OrganizationFiltersPanel
        filters={{ ...defaultFilters, status: 'active', tier: 'enterprise' }}
        onChange={onChange}
      />
    );

    const clearButton = screen.getByText('Clear filters');
    fireEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith({
      search: '',
      status: 'all',
      tier: 'all',
      city: '',
    });
  });

  it('shows filter count badge when multiple filters are active', () => {
    render(
      <OrganizationFiltersPanel
        filters={{ ...defaultFilters, status: 'active', tier: 'enterprise' }}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('removes individual filter when pill close button is clicked', () => {
    const onChange = vi.fn();
    render(
      <OrganizationFiltersPanel
        filters={{ ...defaultFilters, status: 'active', tier: 'enterprise' }}
        onChange={onChange}
      />
    );

    // Find and click the status filter pill remove button
    const statusPill = screen.getByText('Status: active');
    const removeButton = statusPill.parentElement?.querySelector('button');
    if (removeButton) {
      fireEvent.click(removeButton);
    }

    expect(onChange).toHaveBeenCalledWith({
      ...defaultFilters,
      status: 'all',
      tier: 'enterprise',
    });
  });
});
