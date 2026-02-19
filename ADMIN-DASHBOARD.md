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

## ⌨️ Command Palette

Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux) to open the command palette for quick navigation.

### Available Commands

| Section | Command | Shortcut | Description |
|---------|---------|----------|-------------|
| Navigation | Dashboard Overview | `G D` | Go to dashboard |
| Navigation | Organizations | `G O` | Manage organizations |
| Navigation | Analytics | `G A` | View analytics |
| Navigation | Invites | `G I` | Manage invites |
| Navigation | Audit Logs | `G L` | View audit logs |
| Navigation | System Health | `G S` | Check system status |
| Navigation | Settings | `G ,` | Open settings |
| Actions | Toggle Theme | `T` | Switch light/dark mode |
| Actions | New Organization | `N O` | Create organization |
| Actions | New Invite | `N I` | Send new invite |

## 🔍 Advanced Filtering

The Organizations page features an advanced filtering system:

### Available Filters

| Filter | Options | Description |
|--------|---------|-------------|
| Search | Free text | Search by organization name or phone |
| Status | All, Active, Paused, Cancelled | Filter by subscription status |
| Plan | All, Starter, Professional, Enterprise | Filter by subscription tier |
| City | Free text | Filter by location/city |

### Filter Features

- **Real-time updates**: Results update instantly as you type
- **Active filter pills**: Visual indicators of active filters with quick-remove
- **Clear all**: One-click reset of all filters
- **Filter count**: Badge showing number of active filters
- **Empty state**: Helpful message when no results match filters

## 📤 Data Export

The Organizations page supports exporting data to CSV format:

### Export Options

| Button | Description | Use Case |
|--------|-------------|----------|
| **Export CSV** | Export currently displayed organizations | Quick export of filtered results |
| **Export All** | Export all organizations matching filters | Full dataset export |

### CSV Columns

- ID
- Name
- Phone Number
- Email
- Address
- City
- Postal Code
- Plan (subscription tier)
- Status (subscription status)
- Users (count)
- Appointments (count)
- Created At
- Updated At

### Features

- **Filename**: Auto-generated with filters and date (e.g., `organizations-active-enterprise-2026-02-19.csv`)
- **CSV escaping**: Properly handles commas, quotes, and newlines
- **UTF-8 encoding**: Supports special characters (Italian accents, etc.)
- **Filtered export**: Respects active filters
- **Large datasets**: Export All fetches complete dataset via API

## 🚩 Feature Flags

The admin dashboard includes a feature flag system for controlling feature rollouts:

### Feature Flags Page

Navigate to **Feature Flags** in the sidebar to manage feature toggles:

| Column | Description |
|--------|-------------|
| **Feature** | Name, key, and description of the flag |
| **Scope** | Global (all orgs) or Organization-specific |
| **Status** | Enabled or Disabled |
| **Actions** | Toggle, Edit, Delete |

### Using Feature Flags in Code

```typescript
import { useFeatureFlag } from "@/hooks/use-feature-flags";

function MyComponent() {
  const isNewDashboardEnabled = useFeatureFlag("new-dashboard");
  
  return isNewDashboardEnabled ? <NewDashboard /> : <OldDashboard />;
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feature-flags` | List all flags |
| POST | `/api/feature-flags` | Create new flag |
| PATCH | `/api/feature-flags/[id]` | Update flag |
| DELETE | `/api/feature-flags/[id]` | Delete flag |

### Database Schema

```sql
create table feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  description text,
  enabled boolean default false,
  scope text default 'global',
  organization_id uuid references organizations(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## 📊 Custom Reports

Generate and export custom analytics reports from the admin dashboard:

### Available Reports

| Report | Description | Data Source |
|--------|-------------|-------------|
| **Organizations Summary** | Overview with key metrics | organizations table |
| **Subscription Analytics** | Breakdown by tier and status | organizations table |
| **Growth Report** | New organizations over time | organizations table |
| **Appointment Analytics** | Booking trends and stats | appointments table |
| **System Usage** | Platform usage metrics | audit_logs table |

### Report Features

- **Date Range Selection**: 7 days, 30 days, 90 days, 1 year, or all time
- **Summary Stats**: Key metrics at a glance
- **Data Tables**: Detailed breakdowns
- **Export CSV**: Download reports for further analysis

### Report API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/[type]?range=[range]` | Generate report |

Report types: `organizations-summary`, `subscription-analytics`, `growth-report`, `appointment-analytics`, `system-usage`

## 🧪 A/B Testing

Run experiments and optimize conversion rates with the A/B testing dashboard:

### Features

- **Experiment Management**: Create, run, pause, and complete experiments
- **Variant Comparison**: Compare two variants with real-time statistics
- **Conversion Tracking**: Track traffic, conversions, and conversion rates
- **Statistical Significance**: Calculate uplift and statistical significance
- **Winner Declaration**: Mark winning variants for implementation

### Experiment Status

| Status | Description | Actions |
|--------|-------------|---------|
| **Draft** | Not yet started | Start experiment |
| **Running** | Active and collecting data | Pause |
| **Paused** | Temporarily stopped | Resume |
| **Completed** | Finished with winner selected | View analysis |

### Metrics Tracked

| Metric | Description |
|--------|-------------|
| **Traffic** | Number of visitors per variant |
| **Conversions** | Number of successful conversions |
| **Conv. Rate** | Conversion percentage |
| **Uplift** | Relative improvement of variant B vs A |
| **Significance** | Statistical confidence level |

## 🔐 Advanced RBAC

Role-Based Access Control (RBAC) system for managing admin user permissions:

### Features

- **Role Management**: Create, edit, and delete custom roles
- **Permission System**: Granular permissions for all resources
- **System Roles**: Built-in roles (Super Admin, Admin, Support) that cannot be deleted
- **User Assignment**: Assign roles to users

### Default Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Super Admin** | Full system access | All permissions |
| **Admin** | Manage organizations and users | Read/Write on most resources |
| **Support** | View-only access | Read permissions only |

### Available Permissions

Permissions are organized by resource:

| Resource | Actions |
|----------|---------|
| Organizations | Read, Create, Update, Delete |
| Users | Read, Create, Update, Delete |
| Analytics | Read |
| Reports | Read, Export |
| System | Read, Manage |
| Feature Flags | Read, Write |
| Experiments | Read, Write |
| Audit Logs | Read |
| Roles | Read, Write |

### Interface

- **Roles Tab**: View and manage all roles
- **Permissions Tab**: Browse all available permissions
- **User Assignments Tab**: Manage user-role assignments

## 🎨 White-Label Branding

Customize the look and feel of your admin dashboard:

### Customization Options

| Category | Options |
|----------|---------|
| **General** | App name, tagline, favicon, "Powered By" toggle |
| **Colors** | Primary, secondary, accent, background colors |
| **Logo** | Custom logo URL, dimensions |
| **Typography** | Font family, base font size |
| **Layout** | Sidebar width, border radius |
| **Advanced** | Custom CSS injection |

### Preview Mode

Real-time preview of all branding changes before saving.

### Default Branding

| Setting | Default Value |
|---------|---------------|
| App Name | AROS |
| Tagline | Admin Console |
| Primary Color | #22C55E (Green) |
| Secondary Color | #3B82F6 (Blue) |
| Accent Color | #F59E0B (Amber) |
| Background | #0A0A0A (Dark) |
| Font | Inter |
| Border Radius | 8px (0.5rem) |

## 🔑 API Access Management

Manage API keys and access tokens for programmatic access:

### Features

- **API Key Generation**: Create new API keys with custom scopes
- **Key Management**: View, revoke, and rotate keys
- **Usage Tracking**: Monitor API calls and rate limits
- **Scoped Access**: Granular permissions per key
- **Expiration**: Set expiration dates for enhanced security

### Key Statuses

| Status | Description | Action |
|--------|-------------|--------|
| **Active** | Key is valid and can be used | Revoke if needed |
| **Revoked** | Key has been manually disabled | Delete |
| **Expired** | Key passed its expiration date | Renew or delete |

### Available Scopes

| Scope | Access |
|-------|--------|
| `read:organizations` | View organization data |
| `write:organizations` | Modify organizations |
| `read:users` | View users |
| `write:users` | Modify users |
| `read:analytics` | Access analytics |
| `read:appointments` | View appointments |
| `write:appointments` | Modify appointments |
| `read:system` | View system status |
| `admin` | Full access |

### Security Best Practices

- Rotate keys every 90 days
- Use separate keys for production and staging
- Grant minimum required scopes
- Monitor usage for anomalies
- Revoke unused keys immediately

---

## 📱 Mobile Responsive

The admin dashboard is fully responsive and optimized for mobile devices:

### Mobile Layout

- **Header**: Sticky top header with hamburger menu and quick search
- **Sidebar Drawer**: Slide-out navigation menu on mobile
- **Touch-friendly**: All interactive elements are at least 44px for easy tapping
- **Optimized spacing**: Comfortable padding and margins for mobile screens

### Mobile Navigation

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Sidebar | Always visible | Slide-out drawer |
| Navigation | Left sidebar | Hamburger menu |
| Search | In sidebar | In header |
| Command Palette | `Cmd+K` / `Ctrl+K` | Button in header + floating button |

### Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 1024px | Single column, drawer nav |
| Desktop | ≥ 1024px | Sidebar + main content |

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
- [x] Real-time Supabase subscriptions
- [x] Command palette (Cmd+K)
- [x] Advanced filtering
- [x] Export dati

### v1.2
- [x] Feature flags
- [x] A/B testing dashboard
- [x] Custom reports
- [x] Mobile responsive (sidebar collapse)

### v2.0
- [ ] Multi-region support
- [x] Advanced RBAC
- [x] White-label customization
- [x] API access management

---

## 🔗 Collegamenti

- [Customer Dashboard](./apps/voice-dashboard/)
- [Project Summary](./PROJECT-SUMMARY.md)
- [Architecture](./ARCHITECTURE.md)

---

**Built with ❤️ in Italy - 2026**
