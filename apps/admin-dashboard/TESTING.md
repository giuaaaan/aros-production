# 🧪 Testing Guide - Admin Dashboard

Questa guida copre tutta la suite di testing per l'Admin Dashboard di AI-AROS.

## 📊 Panoramica

| Tipo di Test | File | Descrizione |
|--------------|------|-------------|
| **Unit** | `**/*.test.ts(x)` | Componenti, hook, utilities |
| **Integration** | `**/*.integration.test.ts` | API routes |
| **E2E** | `e2e/*.spec.ts` | Playwright browser tests |
| **Load** | `load-tests/*.yml` | Artillery performance tests |

## 🚀 Comandi Rapidi

```bash
# Tutti i test unitari
pnpm test

# Solo unit test
pnpm test:unit

# Watch mode (durante lo sviluppo)
pnpm test:unit:watch

# Coverage report
pnpm test:unit:coverage

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Test di carico
pnpm test:load:smoke
pnpm test:load           # Full load test
pnpm test:load:stress    # Stress test

# Tutti i test (CI)
pnpm test:ci

# Script personalizzato
./scripts/run-all-tests.sh --coverage --with-e2e
```

## 📁 Struttura dei Test

```
src/
├── components/
│   ├── layout/__tests__/connection-status.test.tsx
│   ├── kpi/__tests__/kpi-card.test.tsx
│   └── activity/__tests__/activity-feed.test.tsx
├── hooks/__tests__/
│   ├── use-realtime.test.ts
│   └── use-organizations.test.ts
├── lib/__tests__/utils.test.ts
├── app/
│   ├── (admin)/
│   │   ├── organizations/__tests__/page.test.tsx
│   │   └── analytics/__tests__/page.test.tsx
│   └── api/
│       ├── dashboard/stats/__tests__/route.integration.test.ts
│       ├── activity/__tests__/route.integration.test.ts
│       └── organizations/__tests__/route.integration.test.ts

e2e/
├── auth.spec.ts
└── dashboard.spec.ts

load-tests/
├── smoke-test.yml
├── api-load-test.yml
└── stress-test.yml
```

## 🧪 Unit Test

### Componenti Testati

#### ConnectionStatus
- ✅ Stato connesso (Live)
- ✅ Stato disconnesso (Offline)
- ✅ Transizioni di stato
- ✅ Tooltip content

#### KPICard
- ✅ Rendering base
- ✅ Formattazione currency/number/percentage
- ✅ Badge positive/negative change
- ✅ Styling corretto

#### ActivityFeed
- ✅ Lista attività
- ✅ Empty state
- ✅ Highlight nuove attività
- ✅ Icone per tipo di attività
- ✅ Timestamp relativi
- ✅ Real-time updates (simulati)

### Hook Testati

#### useRealtime
- ✅ Connessione iniziale
- ✅ Gestione errori
- ✅ Cleanup subscription
- ✅ Callback onData

#### useRealtimeStatus
- ✅ Ritorna stato connessione
- ✅ Usa canale connection-check

#### useRealtimeActivity
- ✅ Transform payload in attività
- ✅ Voice → call
- ✅ Whatsapp → whatsapp
- ✅ Max 10 attività
- ✅ Ordine cronologico

#### useOrganizations
- ✅ Fetch organizzazioni
- ✅ Filtri search/status/tier
- ✅ Gestione errori
- ✅ Refetch su cambio parametri

### Pagine Testate

#### Organizations Page
- ✅ Rendering tabella
- ✅ Search input
- ✅ Badge tier/status colorati
- ✅ Loading skeleton
- ✅ Error state
- ✅ Empty state

#### Analytics Page
- ✅ Stat cards rendering
- ✅ Top organizations list
- ✅ Growth percentages
- ✅ Colori positive/negative

## 🔌 Integration Tests

### API Routes

#### GET /api/dashboard/stats
- ✅ Calcolo revenue corretto per tier
- ✅ Conteggio customers attivi
- ✅ Conteggio chiamate oggi
- ✅ Gestione errori
- ✅ Risposta con dati mock

#### GET /api/activity
- ✅ Combina conversations + appointments
- ✅ Transform tipi corretti
- ✅ Ordine cronologico
- ✅ Limite 10 risultati
- ✅ Gestione campi mancanti

#### GET /api/organizations
- ✅ Lista organizzazioni
- ✅ Filtri search/status/tier
- ✅ Count users/appointments
- ✅ Ordinamento by created_at
- ✅ Gestione errori

## 🎭 E2E Tests (Playwright)

### Auth
- ✅ Login page rendering
- ✅ Errori credenziali invalid
- ✅ Redirect dopo login
- ✅ Protezione routes

### Dashboard
- ✅ KPI cards visibili
- ✅ Connection status visibile
- ✅ Activity feed visibile
- ✅ Navigazione menu
- ✅ Responsive layout

## ⚡ Load Tests (Artillery)

### Configurazione

| Test | Durata | RPS | Uso |
|------|--------|-----|-----|
| Smoke | 10s | 1 | Verifica rapida |
| Load | 10min | 5→50 | Test realistico |
| Stress | 5min | 10→500 | Punto di rottura |

### Endpoint Testati

- `/api/dashboard/stats` (30%)
- `/api/activity` (40%)
- `/api/organizations` (25%)
- `/api/organizations?search=...` (5%)

### Thresholds

- p99 < 1000ms
- Error rate < 5%

## 📈 Codecov Integration

### Configurazione

Il progetto è configurato per Codecov con:
- Target coverage: 70%
- Threshold: 5%
- Status checks su PR
- Commenti automatici

### Setup

1. Vai su [codecov.io](https://codecov.io)
2. Connetti il repository
3. Ottieni il token
4. Aggiungi `CODECOV_TOKEN` ai GitHub Secrets

## 📝 Aggiungere Nuovi Test

### Unit Test Componente

```tsx
// src/components/my-component/__tests__/my-component.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MyComponent } from '../my-component'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent prop="value" />)
    expect(screen.getByText('Expected text')).toBeInTheDocument()
  })
})
```

### Integration Test API

```ts
// src/app/api/my-route/__tests__/route.integration.test.ts
import { describe, it, expect, vi } from 'vitest'
import { GET } from '../route'

describe('GET /api/my-route', () => {
  it('returns expected data', async () => {
    const request = new Request('http://localhost/api/my-route')
    const response = await GET(request)
    const data = await response.json()
    expect(data).toHaveProperty('expectedField')
  })
})
```

### E2E Test

```ts
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test'

test('my feature works', async ({ page }) => {
  await page.goto('/my-page')
  await expect(page.getByText('Success')).toBeVisible()
})
```

## 🔧 Mock Utilizzati

### Supabase Client
```typescript
// In src/test/setup.ts
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))
```

### Next.js Router
```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), ... })
}))
```

## 📊 Coverage Targets

| Categoria | Target | File Ignorati |
|-----------|--------|---------------|
| Statements | 70% | UI components |
| Branches | 70% | Generated types |
| Functions | 70% | Test files |
| Lines | 70% | Config files |

## 🐛 Debugging

### Test Falliti

1. **Errore "module not found"**
   - Controllare che il path sia corretto
   - Verificare vitest.config.ts include paths

2. **Mock non funzionano**
   - Usare `vi.mock` all'inizio del file
   - Clear mocks in beforeEach

3. **Test asincroni falliscono**
   - Usare `await waitFor()` per elementi dinamici
   - Aggiungere `act()` per state updates

### Debug Mode

```bash
# Run specific test file
pnpm test src/components/kpi/__tests__/kpi-card.test.tsx

# Run with UI
pnpm test:unit:watch

# Debug single test
pnpm test -- --reporter=verbose --testNamePattern="renders basic card"

# Playwright debug
pnpm test:e2e -- --debug
```

## 🔄 CI/CD Integration

I test sono configurati per girare in CI con:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: pnpm test:ci
```

### Pipeline

1. **Unit Tests** - Eseguiti sempre
2. **Integration Tests** - Eseguiti sempre  
3. **E2E Tests** - Eseguiti sempre
4. **Load Tests** - Solo manual trigger
5. **Codecov** - Upload coverage

## 📚 Risorse

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev/)
- [Artillery](https://www.artillery.io/docs)
- [Codecov](https://docs.codecov.com/)

## ✅ Checklist Pre-Commit

- [ ] Tutti i test unitari passano
- [ ] Coverage rimane sopra 70%
- [ ] Linting senza errori
- [ ] Type check passa
- [ ] Test E2E critici passano
