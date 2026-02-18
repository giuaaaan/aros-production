# 🚀 AROS su GitHub Codespaces (Docker)

## Avvio Rapido (1 click!)

### 1. Apri su GitHub Codespaces
```bash
# Vai su GitHub → Code → Codespaces → Create codespace on main
# Oppure clicca questo badge:
```

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/giuaaaan/aros-production)

### 2. Aspetta l'avvio (2-3 minuti)
Codespaces farà automaticamente:
- ✅ Installa Node.js 20
- ✅ Installa pnpm
- ✅ Avvia PostgreSQL in Docker
- ✅ Installa dipendenze
- ✅ Avvia entrambe le app

### 3. Accedi alle app
Quando vedi "Forwarding ports", clicca su:

| Porta | App | URL |
|-------|-----|-----|
| 3000 | 🎙️ Voice Dashboard (Gestionale) | https://localhost:3000 |
| 3001 | 🎛️ Admin Dashboard | https://localhost:3001 |
| 5432 | 🗄️ PostgreSQL | localhost:5432 |

### 4. Database
PostgreSQL è già configurato con:
- **Host**: `postgres`
- **User**: `postgres`
- **Password**: `postgres`
- **Database**: `aros`

Le migration vengono eseguite automaticamente all'avvio!

---

## Comandi Utili

```bash
# Nel terminale di Codespaces:

# Vedere i logs
docker-compose logs -f

# Restart app
pnpm dev

# Eseguire migration manualmente
docker-compose exec postgres psql -U postgres -d aros -f /docker-entrypoint-initdb.d/COMPLETE_SETUP.sql

# Stop tutto
docker-compose down

# Start tutto
docker-compose up -d
```

---

## Struttura

```
AROS (GitHub Codespaces)
├── 🐳 PostgreSQL (Docker)
├── 🎙️ Voice Dashboard (localhost:3000)
├── 🎛️ Admin Dashboard (localhost:3001)
└── 📂 Shared Volume (codice sorgente)
```

---

## Vantaggi

✅ **Nessuna installazione locale** - Tutto nel cloud
✅ **Database incluso** - PostgreSQL già configurato
✅ **Porte forwardate** - Vedi le app nel browser
✅ **Persistente** - I dati rimangono salvati
✅ **Gratuito** - 120 ore/mese gratis

---

## Problemi?

Se qualcosa non funziona:
1. Clicca "Rebuild Container" in Codespaces
2. Oppure crea un nuovo Codespace
