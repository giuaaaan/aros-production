import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { FeatureFlagsProvider, useFeatureFlags, useFeatureFlag } from '../use-feature-flags';

// Mock fetch
global.fetch = vi.fn();

describe('useFeatureFlags', () => {
  const mockFlags = [
    {
      id: '1',
      key: 'new-dashboard',
      name: 'New Dashboard',
      description: 'Enable new dashboard design',
      enabled: true,
      scope: 'global',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      key: 'beta-feature',
      name: 'Beta Feature',
      description: 'Enable beta features',
      enabled: false,
      scope: 'organization',
      organization_id: 'org-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns feature flags', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ flags: mockFlags }),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
    );

    const { result } = renderHook(() => useFeatureFlags(), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.flags).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('returns error when fetch fails', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
    );

    const { result } = renderHook(() => useFeatureFlags(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch feature flags');
  });

  it('isEnabled returns correct value for enabled flag', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ flags: mockFlags }),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
    );

    const { result } = renderHook(() => useFeatureFlags(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isEnabled('new-dashboard')).toBe(true);
    expect(result.current.isEnabled('beta-feature')).toBe(false);
  });

  it('isEnabled returns false for unknown flag', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ flags: mockFlags }),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
    );

    const { result } = renderHook(() => useFeatureFlags(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isEnabled('unknown-flag')).toBe(false);
  });

  it('refresh function refetches flags', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ flags: mockFlags }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ flags: [...mockFlags, { id: '3', key: 'extra', name: 'Extra', enabled: true, scope: 'global', created_at: '', updated_at: '' }] }),
      });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
    );

    const { result } = renderHook(() => useFeatureFlags(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.flags).toHaveLength(2);

    await result.current.refresh();

    await waitFor(() => {
      expect(result.current.flags).toHaveLength(3);
    });
  });
});

describe('useFeatureFlag', () => {
  const mockFlags = [
    {
      id: '1',
      key: 'enabled-flag',
      name: 'Enabled Flag',
      description: '',
      enabled: true,
      scope: 'global',
      created_at: '',
      updated_at: '',
    },
  ];

  it('returns flag status', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ flags: mockFlags }),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
    );

    const { result } = renderHook(() => useFeatureFlag('enabled-flag'), { wrapper });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('returns false while loading', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
    );

    const { result } = renderHook(() => useFeatureFlag('enabled-flag'), { wrapper });

    expect(result.current).toBe(false);
  });
});
