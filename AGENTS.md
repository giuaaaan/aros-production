# AI AROS - Fort Knox Dashboard
## AI-Augmented Resilient Operations System

---

## Stack Tecnologico

| Layer | Tecnologia |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Supabase |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth (JWT) |
| Monorepo | TurboRepo + pnpm workspaces |
| Deployment | Vercel |
| Testing | Vitest, Playwright |

---

## Struttura Progetto

```
ai-aros-production/
├── apps/
│   ├── dashboard/          # Next.js app principale
│   └── api/               # API routes se separate
├── packages/
│   ├── ui/               # Componenti UI condivisi
│   ├── config/           # Configurazioni condivise
│   └── types/            # TypeScript types
├── supabase/
│   ├── migrations/       # Database migrations
│   └── seed.sql         # Seed data
├── docker/              # Docker configs
└── infra/               # K8s/Terraform configs
```

---

## Convenzioni Codice

### TypeScript
- **STRICT MODE sempre attivo** - nessun `any`
- Tipi espliciti per funzioni esportate
- Interfaces per oggetti di dominio
- `type` per unioni e utility types

### React/Next.js
- Preferire **Server Components** di default
- `'use client'` solo per interattività client
- Loading states con `loading.tsx`
- Error boundaries con `error.tsx`

### Supabase
- **RLS sempre abilitato** su ogni tabella
- Policies testate in `supabase/policies/`
- Types generati con `supabase gen types`
- Migrations con timestamp: `YYYYMMDDHHMMSS_nome.sql`

### Stile
- Tailwind con classi ordinate (plugin Prettier)
- Componenti UI in `packages/ui/`
- Varianti con `class-variance-authority`
- Dark mode supportato

---

## Scripts Importanti

```bash
# Development
pnpm dev              # Tutto in parallelo
pnpm dev:web         # Solo dashboard
pnpm dev:api         # Solo API

# Database
pnpm db:migrate      # Run migrations
pnpm db:studio       # Studio UI

# Testing
pnpm test            # Unit tests
pnpm test:e2e        # Playwright
pnpm test:critical   # Critical path only

# Deploy
pnpm deploy:staging  # Vercel staging
pnpm deploy:prod     # Vercel production
```

---

## Pattern Architetturali

### Data Fetching
```typescript
// Server Component - fetch diretto
async function Page() {
  const { data } = await supabase.from('table').select()
  return <Component data={data} />
}
```

### API Routes
```typescript
// Route Handler con validation
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return Response.json({ error: result.error }, { status: 400 })
  // ...
}
```

### Error Handling
- Usare `neverthrow` per functional error handling
- Log strutturati con correlazione request ID
- User-facing errors tradotti

---

## Sicurezza

### Checklist Critica
- [ ] RLS abilitato su TUTTE le tabelle
- [ ] API keys mai in frontend (solo Supabase anon key)
- [ ] Input validation con Zod su ogni endpoint
- [ ] Rate limiting su API routes
- [ ] CORS configurato correttamente
- [ ] Secrets in `.env.local` (mai committati)

---

## Performance

### Target Web Vitals
- LCP < 2.5s
- INP < 200ms
- CLS < 0.1

### Ottimizzazioni
- Images: `next/image` con WebP
- Fonts: `next/font` con subsetting
- Dynamic imports per componenti pesanti
- React Cache per dati statici
- Supabase Realtime solo dove necessario

---

## Testing

### Unit Tests (Vitest)
- Business logic in `src/lib/` testata
- Mock Supabase per test isolati
- Coverage > 80% per logiche critiche

### E2E (Playwright)
- Critical user journeys testati
- Auth flow completo
- Payment flow (se applicabile)

---

## Database

### Naming Conventions
- Tabelle: `snake_case`, plurale (`users`, `orders`)
- Colonne: `snake_case` (`created_at`, `user_id`)
- Foreign keys: `table_id` (`user_id` referenza `users.id`)
- Indici: `idx_table_column`

### RLS Pattern
```sql
-- Abilita RLS
alter table users enable row level security;

-- Policy: utenti vedono solo i propri dati
create policy "Users can view own data" on users
  for select using (auth.uid() = id);
```

---

## Deploy

### Vercel
- Production branch: `main`
- Preview deploys su ogni PR
- Environment variables in dashboard Vercel
- Supabase connection pooling per produzione

---

## Troubleshooting

### Problemi Comuni

**Errore: "cannot find module '@aiaros/ui'"**
```bash
pnpm install
pnpm build
```

**Migrations fallite**
```bash
supabase db reset
# o
supabase migration repair --status reverted <timestamp>
```

**TypeScript errori strani**
```bash
pnpm clean
pnpm install
```

---

## Risorse

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TurboRepo Docs](https://turbo.build/repo)
- [Project README](./README.md)
