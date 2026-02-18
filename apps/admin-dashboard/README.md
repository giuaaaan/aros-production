# AROS Admin Dashboard ⚙️

[![Tests](https://github.com/OWNER/REPO/workflows/Test%20Suite/badge.svg)](https://github.com/OWNER/REPO/actions)
[![codecov](https://codecov.io/gh/OWNER/REPO/branch/main/graph/badge.svg?flag=admin-dashboard)](https://codecov.io/gh/OWNER/REPO)
[![E2E Tests](https://img.shields.io/badge/E2E-Passing-brightgreen)](e2e/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)

Admin console per la gestione di AROS-Voice. Dashboard real-time per monitorare clienti, chiamate e performance del sistema.

---

## 🎯 Quality Metrics

| Metrica | Valore | Badge |
|---------|--------|-------|
| **Unit Tests** | 80+ | ![Tests](https://img.shields.io/badge/tests-80%2B-brightgreen) |
| **Integration Tests** | 40+ | ![Integration](https://img.shields.io/badge/integration-40%2B-brightgreen) |
| **E2E Tests** | 15+ | ![E2E](https://img.shields.io/badge/E2E-15%2B-brightgreen) |
| **Coverage** | >70% | ![Coverage](https://img.shields.io/badge/coverage->70%25-brightgreen) |
| **Bundle Size** | <200KB | ![Bundle](https://img.shields.io/badge/bundle-<200KB-blue) |

---

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
pnpm dev

# Open http://localhost:3001
```

---

## 🧪 Testing

```bash
# Unit tests (Vitest)
pnpm test:unit

# Unit tests with watch mode
pnpm test:unit:watch

# Coverage report
pnpm test:unit:coverage

# Integration tests
pnpm test:integration

# E2E tests (Playwright)
pnpm test:e2e

# E2E with UI
pnpm test:e2e:ui

# Critical tests only
pnpm test:critical

# Load tests (Artillery)
pnpm test:load:smoke
pnpm test:load

# All tests (CI)
pnpm test:ci

# Run all with script
./scripts/run-all-tests.sh --coverage
```

---

## 📊 Test Coverage

### Unit Tests
- ✅ `components/kpi/kpi-card.tsx` - 10 test
- ✅ `components/layout/connection-status.tsx` - 6 test
- ✅ `components/activity/activity-feed.tsx` - 17 test
- ✅ `hooks/use-realtime.ts` - 23 test
- ✅ `hooks/use-organizations.ts` - 15 test
- ✅ `lib/utils.ts` - 26 test

### Integration Tests
- ✅ `api/dashboard/stats` - 10 test
- ✅ `api/activity` - 16 test
- ✅ `api/organizations` - 16 test

### E2E Tests
- ✅ `auth.spec.ts` - Login flow
- ✅ `dashboard.spec.ts` - Dashboard features
- ✅ `organizations.spec.ts` - Organizations management
- ✅ `analytics.spec.ts` - Analytics page

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (admin)/              # Admin routes with shared layout
│   │   ├── dashboard/        # Main dashboard
│   │   ├── organizations/    # Customer management
│   │   ├── analytics/        # Reports & insights
│   │   ├── system/           # System status
│   │   ├── logs/             # Application logs
│   │   └── sentry-example/   # Sentry testing page
│   ├── api/                  # API routes
│   │   ├── dashboard/stats   # Dashboard statistics
│   │   ├── activity          # Activity feed
│   │   └── organizations     # CRUD organizations
│   └── login/                # Authentication
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── activity/             # Activity feed components
│   ├── charts/               # Data visualization
│   ├── kpi/                  # KPI cards
│   ├── layout/               # Layout components
│   └── error/                # Error boundaries
├── hooks/
│   ├── use-realtime.ts       # Real-time subscriptions
│   ├── use-organizations.ts  # Organizations data
│   └── use-dashboard.ts      # Dashboard data
├── lib/
│   ├── utils.ts              # Utility functions
│   └── supabase/             # Supabase clients
└── test/
    ├── setup.ts              # Test configuration
    ├── mocks/                # Mock data
    └── __tests__/            # Shared tests
```

---

## 🔍 Monitoring

### Sentry Integration
Error tracking and performance monitoring configured.

```bash
# Test Sentry integration
pnpm dev
# Visit: http://localhost:3001/sentry-example-page
```

**Features:**
- Automatic error capture
- Performance monitoring
- Session replay
- Source maps
- User feedback

See [MONITORING.md](./MONITORING.md) for setup details.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS
- **UI**: shadcn/ui + Radix UI
- **Database**: Supabase
- **Testing**: Vitest + React Testing Library + Playwright
- **Load Testing**: Artillery
- **Monitoring**: Sentry
- **CI/CD**: GitHub Actions

---

## 📚 Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Developer onboarding
- **[TESTING.md](./TESTING.md)** - Testing guide
- **[MONITORING.md](./MONITORING.md)** - Sentry & monitoring setup

---

## 🎯 Features

- ✅ Real-time activity feed (Supabase subscriptions)
- ✅ Live connection status indicator
- ✅ KPI cards with trends
- ✅ Organizations management
- ✅ Analytics & reporting
- ✅ Responsive design
- ✅ Dark mode
- ✅ Error boundaries
- ✅ Loading states
- ✅ Empty states

---

## 🏆 Highlights

- **130+ automated tests** covering all critical paths
- **Real-time updates** via Supabase subscriptions
- **Production monitoring** with Sentry
- **Performance tested** with Artillery
- **Type-safe** end-to-end
- **CI/CD ready** with GitHub Actions

---

Built with ❤️ for AROS-Voice 🇮🇹
