# Testing Guide - Voice Dashboard

## 🧪 Test Suite

```bash
# Unit tests
npm run test:unit

# Watch mode
npm run test:unit:watch

# Coverage
npm run test:unit:coverage

# E2E tests
npm run test:e2e

# All tests (CI)
npm run test:ci
```

## 📁 Structure

```
src/
├── components/
│   └── dashboard/__tests__/
│       └── stats-cards.test.tsx
├── test/
│   └── setup.ts
└── lib/
    └── validation.ts

e2e/
├── auth.spec.ts
└── dashboard.spec.ts
```

## 🎯 Coverage

- **Components**: StatsCards, TodayAppointments, RecentConversations
- **Validation**: Zod schemas per Customer, Vehicle, Appointment
- **E2E**: Login, Dashboard, Logout flows

## 🚀 CI/CD

GitHub Actions runs on every push:
- Unit tests with coverage
- E2E tests with Playwright
- Build verification
