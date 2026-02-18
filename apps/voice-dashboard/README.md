# AROS-Voice Dashboard 🎙️

[![Tests](https://github.com/OWNER/REPO/workflows/Voice%20Dashboard%20Test%20Suite/badge.svg)](https://github.com/OWNER/REPO/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

La segretaria AI per officine meccaniche italiane.

## 🚀 Stack Tecnologico 2026

- **Frontend**: Next.js 15 (App Router) + React 19 + Tailwind CSS
- **Database**: Supabase (PostgreSQL + RLS)
- **AI Voice**: Vapi.ai (ElevenLabs + Deepgram + GPT-4o-mini)
- **WhatsApp**: Meta Cloud API
- **Auth**: Supabase Auth
- **Testing**: Vitest + Playwright
- **Monitoring**: Sentry

## 🧪 Testing

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# All tests + coverage
npm run test:ci
```

## 🛡️ Security & Monitoring

- ✅ Rate limiting (100 req/min)
- ✅ Security headers (CSP, HSTS, XSS)
- ✅ Sentry error tracking
- ✅ Health check endpoint (`/api/health`)
- ✅ Zod validation schemas

## 📋 Setup

```bash
cd apps/voice-dashboard
npm install
cp .env.example .env.local
# Configura le variabili
npm run dev
```

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│  CLIENT (Next.js 15)               │
│  • Dashboard UI                    │
│  • Real-time updates               │
│  • Auth (Supabase)                 │
└────────┬────────────────────────────┘
         │
┌────────▼────────────────────────────┐
│  API LAYER                          │
│  • /api/vapi/webhook               │
│  • /api/whatsapp/webhook           │
│  • /api/health                     │
└────────┬────────────────────────────┘
         │
┌────────▼────────────────────────────┐
│  DATABASE (Supabase)               │
│  • RLS per tenant isolation        │
└─────────────────────────────────────┘
```

## 📝 License

Proprietary - All rights reserved
