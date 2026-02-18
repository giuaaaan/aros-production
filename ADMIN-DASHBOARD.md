# Admin Dashboard

**Console amministrativa world-class per AROS-Voice**

Dashboard per gestire e monitorare l'intera piattaforma AROS-Voice. Design ispirato a Vercel, Stripe e Linear.

---

## 🎨 Design Philosophy

### Principi
1. **Dark Mode First** - Riduce affaticamento visivo per sessioni lunghe
2. **Data Density** - Molte informazioni, ben organizzate
3. **Real-time** - Dati sempre aggiornati senza refresh
4. **Action-oriented** - Ogni dato ha un'azione associata

### Color Palette
```css
--background: #0A0A0A      /* Nero profondo */
--card: #141414            /* Grigio scuro */
--border: #262626          /* Bordi sottili */
--primary: #22C55E         /* Verde AROS */
--accent: #22C55E          /* Verde per azioni */
```

---

## 📊 Pagine

### Real-time Features

#### Connection Status
Indicatore sempre visibile nell'header che mostra:
- 🟢 **Live**: Connessione real-time attiva
- 🔴 **Offline**: Connessione persa, dati potrebbero non essere aggiornati

#### Activity Feed Live
Nuove conversazioni e appuntamenti appaiono automaticamente nella dashboard senza refresh:
- Animazione slide-in per nuove attività
- Badge "Live updates" quando ci sono aggiornamenti
- Indicatori pulse per evidenziare contenuto nuovo

### 1. Dashboard Overview
**URL**: `/dashboard`

KPI Cards principali:
- Monthly Revenue (con trend %)
- Active Customers
- Today's AI Calls
- System Health

Grafici:
- Revenue trend (area chart)
- AI Interactions (bar chart: Voice vs WhatsApp)
- Activity feed real-time

### 2. Organizations
**URL**: `/organizations`

Tabella gestione officine:
- Filtri per: nome, città, piano, stato
- Search globale
- Azioni: view, edit, suspend, delete
- Pagination server-side
- Export CSV

Colonne:
- Nome + telefono
- Città
- Piano (starter/professional/enterprise)
- Stato (active/paused/cancelled)
- Numero utenti
- Numero appuntamenti
- Azioni

### 3. Analytics
**URL**: `/analytics`

Metriche avanzate:
- AI Success Rate (%)
- Average Call Duration
- Churn Rate
- NPS Score

Top Performing Organizations
Usage trends

### 4. System Health
**URL**: `/system`

Status board servizi esterni:
- Vapi.ai Voice
- WhatsApp Cloud API
- OpenAI
- Supabase
- Vercel Edge

Per ogni servizio:
- Stato (operational/degraded/down)
- Latency (ms)
- Uptime (%)
- Last checked

### 5. Audit Logs
**URL**: `/logs`

Tracciamento azioni admin:
- Timestamp
- User (chi ha fatto l'azione)
- Action (cosa ha fatto)
- Target (su cosa)
- IP Address
- User Agent

GDPR compliant - mantenuto per 2 anni.

---

## 🛠️ Tech Stack

| Componente | Tecnologia |
|------------|------------|
| Framework | Next.js 15 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS |
| UI | Custom components |
| Icons | Lucide React |
| Charts | Recharts |
| Tables | @tanstack/react-table |
| State URL | nuqs |
| Animations | Framer Motion |

---

## 🚀 Quick Start

```bash
cd apps/admin-dashboard
npm install

# Environment
cp .env.example .env.local
# Aggiungi:
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=

npm run dev
# http://localhost:3001
```

---

## 📁 File Structure

```
admin-dashboard/
├── src/
│   ├── app/
│   │   ├── (admin)/
│   │   │   ├── dashboard/page.tsx      # Overview
│   │   │   ├── organizations/page.tsx  # Gestione officine
│   │   │   ├── analytics/page.tsx      # Statistiche
│   │   │   ├── system/page.tsx         # Health check
│   │   │   ├── logs/page.tsx           # Audit logs
│   │   │   └── layout.tsx              # Shell con sidebar
│   │   ├── login/page.tsx              # Auth
│   │   └── layout.tsx                  # Root layout
│   │
│   ├── components/
│   │   ├── ui/                         # Button, Card, Input, etc.
│   │   ├── layout/
│   │   │   ├── sidebar.tsx             # Navigation
│   │   │   ├── header.tsx              # Top bar
│   │   │   └── admin-shell.tsx         # Layout wrapper
│   │   ├── kpi/
│   │   │   ├── kpi-card.tsx            # Metric card
│   │   │   └── kpi-grid.tsx            # Grid 4 colonne
│   │   ├── charts/
│   │   │   ├── revenue-chart.tsx       # Area chart
│   │   │   └── activity-chart.tsx      # Bar chart
│   │   └── activity/
│   │       └── activity-feed.tsx       # Real-time feed
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser client
│   │   │   ├── server.ts               # Server client
│   │   │   └── database.types.ts       # TypeScript types
│   │   └── utils.ts                    # formatCurrency, etc.
│   │
│   └── types/
│       └── index.ts                    # Organization, Activity, etc.
│
├── package.json
├── tailwind.config.ts
└── README.md
```

---

## 🔐 Autenticazione

### Ruoli
- `super_admin` - Accesso completo
- `admin` - Gestione organizations, analytics
- `support` - Solo view, audit logs

### Middleware
```typescript
// Controlla ruolo admin
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (!['super_admin', 'admin', 'support'].includes(profile.role)) {
  redirect('/login')
}
```

### Service Role
Le API route admin usano `SUPABASE_SERVICE_ROLE_KEY` per:
- Bypassare RLS
- Leggere dati di tutte le organizations
- Modificare configurazioni globali

⚠️ **ATTENZIONE**: Mai esporre service key al client!

---

## 📊 Componenti Chiave

### KPI Card
```typescript
<KPICard
  title="Monthly Revenue"
  value={14900}
  format="currency"
  change={12.5}
  icon={<DollarSign />}
/>
```

### Data Table
```typescript
// @tanstack/react-table
// Sorting, filtering, pagination
// Row actions (view, edit, delete)
// Export CSV
```

### Charts
```typescript
// Recharts
<AreaChart data={revenueData}>
  <Area type="monotone" dataKey="revenue" />
</AreaChart>
```

---

## 🎯 Roadmap

### MVP (Ora)
- [x] Layout con sidebar
- [x] KPI Cards
- [x] Organizations table
- [x] System health
- [x] Supabase Auth integration
- [x] Real data from database
- [x] Real-time subscriptions
- [x] Connection status indicator

### v1.1
- [ ] Real-time Supabase subscriptions
- [ ] Command palette (Cmd+K)
- [ ] Advanced filtering
- [ ] Export dati

### v1.2
- [ ] Feature flags
- [ ] A/B testing dashboard
- [ ] Custom reports
- [ ] Mobile responsive (sidebar collapse)

### v2.0
- [ ] Multi-region support
- [ ] Advanced RBAC
- [ ] White-label customization
- [ ] API access management

---

## 🔗 Collegamenti

- [Customer Dashboard](./apps/voice-dashboard/)
- [Project Summary](./PROJECT-SUMMARY.md)
- [Architecture](./ARCHITECTURE.md)

---

**Built with ❤️ in Italy - 2026**
