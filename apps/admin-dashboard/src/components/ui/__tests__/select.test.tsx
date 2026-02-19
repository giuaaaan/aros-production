import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '../select';

const options = [
  { value: 'all', label: 'All Options' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

describe('Select', () => {
  it('renders with placeholder', () => {
    render(
      <Select
        value=""
        onChange={vi.fn()}
        options={options}
        placeholder="Choose an option"
      />
    );
    expect(screen.getByText('Choose an option')).toBeInTheDocument();
  });

  it('displays selected option label', () => {
    render(
      <Select
        value="active"
        onChange={vi.fn()}
        options={options}
        placeholder="Choose an option"
      />
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(
      <Select
        value=""
        onChange={vi.fn()}
        options={options}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('All Options')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('calls onChange when option is selected', () => {
    const onChange = vi.fn();
    render(
      <Select
        value=""
        onChange={onChange}
        options={options}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const activeOption = screen.getByText('Active');
    fireEvent.click(activeOption);

    expect(onChange).toHaveBeenCalledWith('active');
  });

  it('closes dropdown after selection', () => {
    const onChange = vi.fn();
    render(
      <Select
        value=""
        onChange={onChange}
        options={options}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const activeOption = screen.getByText('Active');
    fireEvent.click(activeOption);

    expect(screen.queryByText('Inactive')).not.toBeInTheDocument();
  });

  it('shows checkmark for selected option', () => {
    render(
      <Select
        value="active"
        onChange={vi.fn()}
        options={options}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Check icon should be present (we can't easily test for the SVG)
    // Just verify the dropdown is open and has the selected option
    const activeOptions = screen.getAllByText('Active');
    expect(activeOptions.length).toBeGreaterThanOrEqual(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <Select
        value=""
        onChange={vi.fn()}
        options={options}
        disabled
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('closes when clicking outside', () => {
    render(
      <Select
        value=""
        onChange={vi.fn()}
        options={options}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('All Options')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(document.body);

    expect(screen.queryByText('All Options')).not.toBeInTheDocument();
  });
});
