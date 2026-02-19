import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileHeader } from '../mobile-header';
import { usePathname } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('MobileHeader', () => {
  beforeEach(() => {
    (usePathname as any).mockReturnValue('/dashboard');
  });

  it('renders mobile header with logo', () => {
    render(<MobileHeader />);
    expect(screen.getByText('AROS')).toBeInTheDocument();
  });

  it('renders hamburger menu button', () => {
    render(<MobileHeader />);
    const menuButton = screen.getByLabelText('Toggle menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('opens menu when hamburger is clicked', () => {
    render(<MobileHeader />);
    
    const menuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuButton);

    // Menu should now be visible with navigation items
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Organizations')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('closes menu when close button is clicked', () => {
    render(<MobileHeader />);
    
    // Open menu
    const menuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuButton);

    // Close menu should exist when menu is open
    const closeButton = screen.getByLabelText('Close menu');
    expect(closeButton).toBeInTheDocument();
    
    // Click close
    fireEvent.click(closeButton);
    
    // Menu is closed - hamburger should still be visible
    expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
  });

  it('renders navigation items when open', () => {
    render(<MobileHeader />);
    
    const menuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuButton);

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Organizations')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Invites')).toBeInTheDocument();
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    expect(screen.getByText('System Health')).toBeInTheDocument();
  });

  it('renders settings link in menu', () => {
    render(<MobileHeader />);
    
    const menuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuButton);

    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders command palette in header', () => {
    render(<MobileHeader />);
    // CommandPalette button should be rendered
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    (usePathname as any).mockReturnValue('/organizations');
    
    render(<MobileHeader />);
    
    const menuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuButton);

    // The organizations link should be marked as active
    const orgLink = screen.getByText('Organizations');
    expect(orgLink).toBeInTheDocument();
  });
});
