# 🚀 Development Guide

Guida completa per sviluppatori che entrano nel progetto AI-AROS Admin Dashboard.

## 📋 Prerequisiti

- Node.js 20+
- pnpm 9+
- Git

## 🛠️ Setup Iniziale

```bash
# 1. Clona il repository
git clone <repo-url>
cd ai-aros-production/apps/admin-dashboard

# 2. Installa dipendenze
pnpm install

# 3. Configura environment
cp .env.example .env.local
# Modifica .env.local con le tue variabili

# 4. Verifica setup
pnpm test:load:smoke  # Quick sanity check
pnpm dev              # Start development server
```

## 📁 Struttura Progetto

```
app/
├── (admin)/           # Route group (layout con sidebar)
│   ├── dashboard/     # Dashboard principale
│   ├── organizations/ # Gestione organizzazioni
│   ├── analytics/     # Analisi e report
│   ├── system/        # Stato sistema
│   ├── logs/          # Log applicazione
│   └── sentry-example-page/  # Test Sentry
├── api/               # API Routes
│   ├── dashboard/     # Stats API
│   ├── activity/      # Activity feed API
│   └── organizations/ # Organizations API
├── login/             # Pagina login
├── layout.tsx         # Root layout
└── globals.css        # Stili globali

components/
├── ui/               # Shadcn UI components
├── layout/           # Layout components
├── kpi/              # KPI cards
├── charts/           # Grafici
├── activity/         # Activity feed
└── error/            # Error boundaries

hooks/
├── use-dashboard.ts
├── use-organizations.ts
└── use-realtime.ts

lib/
├── utils.ts          # Utility functions
└── supabase/         # Supabase clients

test/
├── setup.ts          # Test setup
├── mocks/            # Mock data
└── __tests__/        # Test condivisi

load-tests/           # Artillery tests
```

## 🧪 Eseguire i Test

### Comandi Base

```bash
# Unit tests
pnpm test:unit

# Watch mode (durante sviluppo)
pnpm test:unit:watch

# Coverage
pnpm test:unit:coverage

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Load tests
pnpm test:load:smoke
```

### Script Combinato

```bash
# Tutti i test (tranne e2e/load)
./scripts/run-all-tests.sh

# Con coverage
./scripts/run-all-tests.sh --coverage

# Con E2E
./scripts/run-all-tests.sh --with-e2e
```

## 🔄 Workflow di Sviluppo

### 1. Feature Branch

```bash
git checkout -b feature/nome-feature
```

### 2. Sviluppo con Test

```bash
# Terminal 1: Dev server
pnpm dev

# Terminal 2: Test watch
pnpm test:unit:watch
```

### 3. Pre-commit Checks

```bash
# 1. Lint
pnpm lint

# 2. Type check
pnpm type-check  # o tsc --noEmit

# 3. Test
pnpm test:unit

# 4. Build
pnpm build
```

### 4. Commit

```bash
git add .
git commit -m "feat: descrizione feature"
git push origin feature/nome-feature
```

## 🐛 Debugging

### Errori Comuni

**"Module not found"**
```bash
# Soluzione: pulisci cache
rm -rf .next
rm -rf node_modules
pnpm install
```

**"Test fallisce solo in CI"**
```bash
# Verifica environment
pnpm test:ci
# Controlla timezone, env vars
```

**"Supabase connection failed"**
```bash
# Verifica env vars
cat .env.local | grep SUPABASE
```

### Debug Tools

- **React DevTools**: Estensione browser
- **Sentry DevTools**: Pagina `/sentry-example-page`
- **Network Tab**: Per API debugging
- **VS Code Debugger**: Configurazione in `.vscode/launch.json`

## 📝 Convenzioni Codice

### Naming

- **Components**: PascalCase (`KpiCard.tsx`)
- **Hooks**: camelCase con prefisso `use` (`useOrganizations.ts`)
- **Utils**: camelCase (`formatCurrency.ts`)
- **Test**: stesso nome del file + `.test.ts`

### Import Ordine

```typescript
// 1. React/Next
import { useState } from "react";
import { useRouter } from "next/navigation";

// 2. Third-party
import * as Sentry from "@sentry/nextjs";

// 3. Absolute imports (@/)
import { Button } from "@/components/ui/button";
import { useOrganizations } from "@/hooks/use-organizations";

// 4. Relative imports (./)
import { MyComponent } from "./my-component";
```

### Stili

- Usare Tailwind CSS per stili
- Usare `cn()` per classi condizionali
- Seguire design system esistente

### Testing

- **Unit**: Per logica pura, hooks, utilities
- **Integration**: Per API routes
- **E2E**: Per user flows critici
- **Coverage**: Minimo 70%

## 🚀 Deploy

### Staging (Vercel Preview)

Ogni push su una PR crea automaticamente un deployment preview.

### Produzione

```bash
# 1. Merge su main
git checkout main
git merge feature/nome-feature

# 2. Push triggers deploy
git push origin main

# 3. Verifica in produzione
# - Dashboard Sentry
# - Test E2E critici
```

## 📊 Monitoraggio

### Sentry

URL: [sentry.io/organizations/your-org](https://sentry.io)

Cosa monitorare:
- Issues (nuovi errori)
- Performance (API latency)
- Releases (correlazione deploy/errori)

### Vercel Analytics

URL: [vercel.com/dashboard](https://vercel.com)

Metriche:
- Web Vitals
- Build time
- Deployment status

## 🆘 Supporto

### Documentazione

- `TESTING.md` - Guida testing completa
- `MONITORING.md` - Setup Sentry e monitoring
- `README.md` - Overview progetto

### Comandi Utili

```bash
# Pulizia totale
pnpm clean

# Reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Build produzione
pnpm build

# Analyze bundle
pnpm analyze
```

## ✅ Checklist Nuovo Sviluppatore

- [ ] Repo clonato e `pnpm install` eseguito
- [ ] `.env.local` configurato con credenziali
- [ ] `pnpm dev` funziona (localhost:3001)
- [ ] Test passano (`pnpm test:unit`)
- [ ] Build passa (`pnpm build`)
- [ ] Accesso a Sentry richiesto
- [ ] Accesso a Vercel richiesto
- [ ] Onboarding con team lead completato

## 🎓 Risorse Learning

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [React Testing Library](https://testing-library.com/react)
- [Sentry Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

---

**Buon lavoro! 🚀**
