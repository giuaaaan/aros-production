# 📊 Production Monitoring Guide

Questa guida copre il monitoraggio in produzione dell'Admin Dashboard con **Sentry**.

## 🎯 Overview

Il monitoraggio è configurato per tracciare:
- ✅ Errori JavaScript (client e server)
- ✅ Performance delle API (latency)
- ✅ Session Replay per debugging
- ✅ User feedback e breadcrumb

## 🚀 Setup Iniziale

### 1. Creare Progetto Sentry

1. Vai su [sentry.io](https://sentry.io) e crea un account
2. Crea un nuovo progetto: **Next.js** → **Admin Dashboard**
3. Copia il **DSN** dal progetto

### 2. Configurare Environment Variables

```bash
# .env.local (development)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxx@sentry.io/xxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=admin-dashboard

# Vercel (Production)
# Aggiungi in Settings → Environment Variables
```

### 3. Installare Dipendenze

```bash
pnpm install
# @sentry/nextjs è già incluso in package.json
```

### 4. Verifica Build

```bash
pnpm build
```

Se il build fallisce, controlla che `SENTRY_AUTH_TOKEN` sia impostato per l'upload delle source maps.

## 📁 File di Configurazione

### Configurazioni Principali

| File | Scopo |
|------|-------|
| `sentry.client.config.ts` | Browser/Client |
| `sentry.server.config.ts` | Node.js Server |
| `sentry.edge.config.ts` | Edge Runtime |
| `next.config.ts` | Build & Source Maps |

### Componenti

| Componente | Scopo |
|------------|-------|
| `SentryErrorBoundary` | Catch error React |
| `captureError()` | Utility per errori |
| `logInfo()` | Logging strutturato |
| `addBreadcrumb()` | Tracciamento azioni |

## 🧪 Test in Development

### Pagina di Test

Visita: `http://localhost:3001/sentry-example-page`

Funzionalità disponibili:
- Throw Client Error
- Trigger Server Error
- Capture Error Manually
- Log Info Message
- Add Breadcrumb
- Set/Clear User Context

### Verifica Errori

1. Clicca "Throw Client Error"
2. Controlla la console
3. Vai su [Sentry Issues](https://sentry.io)
4. Dovresti vedere l'errore entro pochi secondi

## 📈 Dashboard Sentry

### Metriche Principali

| Metrica | Soglia Allarme | Descrizione |
|---------|----------------|-------------|
| Error Rate | > 1% | Percentuale richieste con errori |
| Apdex | < 0.85 | User satisfaction score |
| p95 Latency | > 1000ms | 95° percentile latency |
| Crash Free Users | < 99% | Utenti senza crash |

### Issue Tracking

**Severity Levels:**
- 🔴 **Fatal**: Crash applicazione
- 🟠 **Error**: Errori catturati
- 🟡 **Warning**: Warning importanti
- 🔵 **Info**: Eventi informativi
- ⚪ **Debug**: Debug info

### Performance Monitoring

**Transactions tracciate:**
- `GET /api/dashboard/stats`
- `GET /api/activity`
- `GET /api/organizations`
- Page loads
- Component rendering

## 🔔 Allarmi (Alerts)

### Configurazione Consigliata

**Alert 1: Error Spike**
```
When: Number of errors > 100 in 5 minutes
Action: Send email + Slack notification
```

**Alert 2: New Issue**
```
When: New issue is created
Action: Send Slack notification
```

**Alert 3: Performance Degradation**
```
When: p95 latency > 1000ms for 10 minutes
Action: Send email to team
```

**Alert 4: Crash Free Sessions**
```
When: Crash free rate < 99% in 1 hour
Action: Page on-call engineer
```

## 🔒 Privacy & Sicurezza

### Sanitizzazione Dati

Il sistema rimuove automaticamente:
- Header `Authorization`
- Header `Cookie`
- Password dai form
- Token JWT

### Session Replay

**Cosa viene mascherato:**
- Input fields (password, credit card)
- Console logs (se configurato)
- Network request bodies (se contengono dati sensibili)

**Configurazione in `sentry.client.config.ts`:**
```typescript
Sentry.replayIntegration({
  maskAllText: false,  // Mostra testo (tranne input password)
  blockAllMedia: false, // Permetti screenshot media
});
```

## 🛠️ Utilizzo nel Codice

### Catturare Errori Manualmente

```typescript
import { captureError } from "@/components/error/sentry-error-boundary";

try {
  await riskyOperation();
} catch (error) {
  captureError(error, { 
    component: "MyComponent",
    userAction: "submit_form",
    formData: { id: 123 }  // Dati non sensibili
  });
}
```

### Aggiungere Breadcrumb

```typescript
import { addBreadcrumb } from "@/components/error/sentry-error-boundary";

addBreadcrumb(
  "User clicked checkout button",
  "user-action",
  "info"
);
```

### Settare Utente

```typescript
import * as Sentry from "@sentry/nextjs";

// Quando l'utente fa login
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// Quando l'utente fa logout
Sentry.setUser(null);
```

## 📊 Custom Dashboards

### Dashboard "Admin Health"

Widget consigliati:
1. **Error Rate (24h)** - Trend errori
2. **Top Issues** - Errori più frequenti
3. **Performance Overview** - Latenza API
4. **User Feedback** - Segnalazioni utenti

### Dashboard "API Performance"

Widget consigliati:
1. **p50/p95/p99 Latency** per endpoint
2. **Throughput (RPM)** - Richieste per minuto
3. **Error Rate by Endpoint** - Errori per API
4. **Slow Queries** - Query più lente

## 🔧 Troubleshooting

### Errori non appaiono in Sentry

1. Controlla DSN:
   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. Verifica build:
   ```bash
   pnpm build 2>&1 | grep -i sentry
   ```

3. Controlla console browser per errori CORS

4. Verifica rate limits in Sentry

### Source Maps non funzionano

1. Controlla `SENTRY_AUTH_TOKEN`:
   ```bash
   echo $SENTRY_AUTH_TOKEN
   ```

2. Verifica in Sentry → Releases → Source Maps

3. Controlla che ` widenClientFileUpload: true` sia in next.config.ts

### Performance tracking non attivo

1. Verifica `tracesSampleRate`:
   - Development: 1.0 (100%)
   - Production: 0.1 (10%)

2. Controlla che le fetch sanno instrumented

## 🔄 CI/CD Integration

### GitHub Actions

Il workflow esistente include già Sentry:

```yaml
- name: Build with Sentry
  run: pnpm build
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    NEXT_PUBLIC_SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
```

### Vercel

Aggiungi in Project Settings → Environment Variables:

```
NEXT_PUBLIC_SENTRY_DSN=https://.../...
SENTRY_ORG=your-org
SENTRY_PROJECT=admin-dashboard
SENTRY_AUTH_TOKEN=sntrys_ey...
```

## 📈 Ottimizzazione

### Ridurre Noise

**Filtrare errori noti:**
```typescript
// sentry.client.config.ts
ignoreErrors: [
  /^ResizeObserver loop/,      // Falso positivo comune
  /^Non-Error promise rejection/,
  /chrome-extension/,          // Errori estensioni
],
```

**Sample rate adattivo:**
```typescript
// Riduci sampling per utenti premium o internal
const sampleRate = user.isInternal ? 0.01 : 0.1;
```

### Bundle Size

Il bundle Sentry aggiunge ~50KB gzip. Per ridurre:

```typescript
// Usa lazy loading per Sentry
import("@sentry/nextjs").then(Sentry => {
  Sentry.init({ ... });
});
```

## 📚 Risorse

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)
- [Alerts & Notifications](https://docs.sentry.io/product/alerts/)

## ✅ Checklist Pre-Deploy

- [ ] DSN configurato in produzione
- [ ] Source maps upload funzionante
- [ ] Test errori in staging
- [ ] Alerts configurati
- [ ] Team ha accesso a Sentry
- [ ] On-call procedure definite
