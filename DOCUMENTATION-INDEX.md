# AROS-Voice Documentation Index

Complete documentation for the AI Receptionist platform for Italian auto repair shops.

---

## 📖 Essential Reading (Start Here)

| Document | Description | Audience |
|----------|-------------|----------|
| **[README.md](./README.md)** | Project overview, quick start, features | Everyone |
| **[PROJECT-SUMMARY.md](./PROJECT-SUMMARY.md)** | What's implemented, current status | Developers, PM |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | System design, data flow, tech stack | Developers, Architects |
| **[ADMIN-DASHBOARD.md](./ADMIN-DASHBOARD.md)** | Admin console docs | Developers |

---

## 🚀 Getting Started

| Document | Description |
|----------|-------------|
| **[README.md#quick-start](./README.md#quick-start)** | 5-minute setup guide |
| **[KIMI.md](./KIMI.md)** | Development context, patterns, best practices |
| **[MIGRATION.md](./MIGRATION.md)** | Why we pivoted from K8s to SaaS |

---

## 🏗️ Architecture & Technical

| Document | Description |
|----------|-------------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | System architecture, data flow, security |
| **[KIMI.md#rls-patterns](./KIMI.md#rls-patterns)** | Database RLS best practices |
| **[KIMI.md#ai-integration](./KIMI.md#ai-integration)** | Vapi.ai and OpenAI integration |

---

## 📋 Product & Roadmap

| Document | Description |
|----------|-------------|
| **[ENTERPRISE-ROADMAP.md](./ENTERPRISE-ROADMAP.md)** | Product roadmap, phases, milestones |
| **[CHANGELOG.md](./CHANGELOG.md)** | Version history, what's new |

---

## 🔧 Development

### Core Code
```
apps/voice-dashboard/
├── src/
│   ├── app/api/vapi/webhook/route.ts      # Voice AI handler
│   ├── app/api/whatsapp/webhook/route.ts  # WhatsApp handler
│   ├── app/dashboard/                     # Dashboard pages
│   └── lib/supabase/                      # Database clients
└── supabase/migrations/001_initial_schema.sql
```

### Key Technical Documents
- **[KIMI.md](./KIMI.md)** - Development guide, patterns, troubleshooting

---

## 📊 Historical Documentation

Documents from previous iterations (for reference):

| Document | Era | Status |
|----------|-----|--------|
| ENTERPRISE-* | K8s era | Deprecated |
| IMPLEMENTATION-* | Legacy | Historical |
| DEPLOY* | K8s deployment | Deprecated |
| CONSOLIDATION.md | Old refactor | Historical |

---

## 🗺️ Documentation Map

```
AROS-Voice Documentation
│
├── 🎯 Essential (Read First)
│   ├── README.md
│   ├── PROJECT-SUMMARY.md
│   └── ARCHITECTURE.md
│
├── 🚀 Getting Started
│   ├── KIMI.md
│   └── MIGRATION.md
│
├── 📋 Product
│   ├── ENTERPRISE-ROADMAP.md
│   └── CHANGELOG.md
│
└── 📁 Historical (Reference Only)
    ├── ENTERPRISE-*
    ├── IMPLEMENTATION-*
    └── DEPLOY*
```

---

## 🔍 Find By Topic

### Voice AI
- [README.md#-voice-ai-sofia](./README.md)
- [ARCHITECTURE.md#voice-call-flow](./ARCHITECTURE.md)
- [KIMI.md#vapiai-voice](./KIMI.md)

### WhatsApp
- [README.md#-whatsapp-integration](./README.md)
- [ARCHITECTURE.md#whatsapp-message-flow](./ARCHITECTURE.md)
- [KIMI.md#whatsapp-integration](./KIMI.md)

### Database/Supabase
- [ARCHITECTURE.md#data-architecture](./ARCHITECTURE.md)
- [KIMI.md#rls-patterns](./KIMI.md)
- [KIMI.md#database-patterns](./KIMI.md)

### Security
- [ARCHITECTURE.md#security-architecture](./ARCHITECTURE.md)
- [KIMI.md#rls-patterns](./KIMI.md)

### Deployment
- [README.md#-deployment](./README.md)
- [KIMI.md#deployment](./KIMI.md)

---

## 📝 Document Status Legend

| Icon | Meaning |
|------|---------|
| ✅ | Current, maintained |
| 🔄 | Under review |
| 📦 | Legacy, reference only |
| 🗑️ | Deprecated |

---

## 🆘 Need Help?

1. **Quick questions?** → Check [KIMI.md](./KIMI.md) troubleshooting section
2. **Architecture questions?** → Read [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **Setup issues?** → Follow [README.md](./README.md) quick start

---

**Last Updated:** February 2026  
**Version:** AROS-Voice v1.0.0  
**Maintained by:** AROS Team
