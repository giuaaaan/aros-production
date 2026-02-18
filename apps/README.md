# Apps Directory

Questa cartella contiene le applicazioni **attive** di AROS-Voice.

---

## 🚀 Applicazioni Attive

### 1. `voice-dashboard/` ← **USARE QUESTO**

**L'unica applicazione funzionante e mantenuta.**

```
voice-dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── vapi/webhook/        # Voice AI (Vapi.ai)
│   │   │   └── whatsapp/webhook/    # WhatsApp (Meta API)
│   │   ├── dashboard/               # Dashboard UI
│   │   └── login/                   # Auth pages
│   ├── components/                  # React components
│   └── lib/supabase/                # Database clients
├── supabase/migrations/             # Schema DB
└── package.json
```

**Stack:**
- Next.js 15 (App Router)
- React 19
- Supabase (PostgreSQL + Auth)
- Tailwind CSS
- Vapi.ai (Voice)
- OpenAI (LLM)
- Meta Cloud API (WhatsApp)

**Per iniziare:**
```bash
cd voice-dashboard
npm install
npm run dev
```

---

### 2. `portal/` (Opzionale)

Documentazione site / API reference. Può essere utile ma non essenziale.

---

## ❌ Codice Deprecato

**Non usare il codice in `archive/legacy-apps/`** - è l'architettura K8s obsoleta.

Vedi: [archive/README.md](../archive/README.md)

---

## 📚 Documentazione

- [README.md](../README.md) - Panoramica progetto
- [PROJECT-SUMMARY.md](../PROJECT-SUMMARY.md) - Feature implementate
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Architettura sistema
