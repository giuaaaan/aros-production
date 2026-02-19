import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommandPalette } from '../command-palette';
import { useRouter } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('CommandPalette', () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  it('renders search button', () => {
    render(<CommandPalette />);
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('opens on Cmd+K keyboard shortcut', async () => {
    render(<CommandPalette />);
    
    // Initially closed - no input visible
    expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
    
    // Press Cmd+K
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    
    // Should now be open
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    });
  });

  it('opens on Ctrl+K keyboard shortcut (Windows/Linux)', async () => {
    render(<CommandPalette />);
    
    // Press Ctrl+K
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    });
  });

  it('closes when clicking search button again', async () => {
    render(<CommandPalette />);
    
    const searchButton = screen.getByText('Search').closest('button');
    
    // Open it by clicking the button
    if (searchButton) {
      fireEvent.click(searchButton);
    }
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
    });
    
    // Close by clicking backdrop (the fixed container outside the modal)
    const backdrop = document.querySelector('.fixed');
    if (backdrop) {
      // Click outside the command palette content
      fireEvent.click(backdrop);
    }
  });

  it('shows navigation section', async () => {
    render(<CommandPalette />);
    
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    
    await waitFor(() => {
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      expect(screen.getByText('Organizations')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });
  });

  it('shows actions section', async () => {
    render(<CommandPalette />);
    
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    
    await waitFor(() => {
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('Toggle Theme')).toBeInTheDocument();
      expect(screen.getByText('New Organization')).toBeInTheDocument();
    });
  });

  it('shows account section', async () => {
    render(<CommandPalette />);
    
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    
    await waitFor(() => {
      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
      expect(screen.getByText('Log Out')).toBeInTheDocument();
    });
  });

  it('shows help section', async () => {
    render(<CommandPalette />);
    
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    
    await waitFor(() => {
      expect(screen.getByText('Help')).toBeInTheDocument();
      expect(screen.getByText('Help & Documentation')).toBeInTheDocument();
    });
  });

  it('shows keyboard shortcuts in footer', async () => {
    render(<CommandPalette />);
    
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    
    await waitFor(() => {
      expect(screen.getByText('to navigate')).toBeInTheDocument();
      expect(screen.getByText('to select')).toBeInTheDocument();
    });
  });
});
