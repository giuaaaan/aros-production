# AROS-Voice Architecture

Architecture documentation for the AI receptionist platform for Italian auto repair shops.

---

## 📐 System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT CHANNELS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │   Phone     │    │  WhatsApp   │    │   Web UI    │                     │
│  │   (PSTN)    │    │  (Messaging)│    │  (Dashboard)│                     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                     │
│         │                  │                  │                             │
│         └──────────────────┴──────────────────┘                             │
│                            │                                                │
└────────────────────────────┼────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AROS-VOICE PLATFORM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Next.js 15 Application                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  Voice API   │  │ WhatsApp API │  │  Dashboard   │              │   │
│  │  │  /api/vapi   │  │/api/whatsapp │  │   (App)      │              │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │   │
│  │         │                 │                 │                       │   │
│  │         └─────────────────┴─────────────────┘                       │   │
│  │                           │                                         │   │
│  │              ┌────────────▼────────────┐                           │   │
│  │              │    Supabase Client      │                           │   │
│  │              │    (SSR/Edge)           │                           │   │
│  │              └────────────┬────────────┘                           │   │
│  └───────────────────────────┼────────────────────────────────────────┘   │
│                              │                                             │
└──────────────────────────────┼─────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER (Supabase)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL + Row Level Security                   │   │
│  │                                                                     │   │
│  │  Tables:                                                            │   │
│  │  • organizations - Officine (tenants)                              │   │
│  │  • profiles      - Utenti e ruoli                                   │   │
│  │  • customers     - Anagrafica clienti                               │   │
│  │  • vehicles      - Dati veicoli                                     │   │
│  │  • appointments  - Appuntamenti                                     │   │
│  │  • conversations - Storico AI conversations                         │   │
│  │  • ai_configs    - Configurazione AI per officina                   │   │
│  │                                                                     │   │
│  │  RLS Policies: Tenant Isolation                                     │   │
│  │  • auth.get_user_org_id()                                           │   │
│  │  • auth.user_belongs_to_org()                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL AI SERVICES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    │
│  │  Vapi.ai    │   │ ElevenLabs  │   │  Deepgram   │   │   OpenAI    │    │
│  │  (Voice     │   │   (TTS -    │   │  (STT -     │   │   (LLM -    │    │
│  │   Platform) │   │   Voice)    │   │  Italian)   │   │   GPT-4o)   │    │
│  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘    │
│                                                                             │
│  ┌─────────────┐                                                            │
│  │ Meta Cloud  │                                                            │
│  │   (WhatsApp │                                                            │
│  │    API)     │                                                            │
│  └─────────────┘                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Data Architecture

### Database Schema (Supabase PostgreSQL)

```sql
-- Core Tables with RLS

organizations
├── id (UUID PK)
├── name (text)
├── phone_number (text)
├── whatsapp_number (text)
├── subscription_tier (enum: starter/professional/enterprise)
└── settings (jsonb)

profiles
├── id (UUID PK, FK auth.users)
├── org_id (UUID FK organizations)
├── email (text)
├── first_name (text)
├── last_name (text)
├── role (enum: admin/manager/mechanic/receptionist)
└── is_active (boolean)

customers
├── id (UUID PK)
├── org_id (UUID FK)
├── phone (text)
├── email (text)
├── first_name (text)
├── last_name (text)
├── gdpr_consent (boolean)
└── UNIQUE(org_id, phone)

vehicles
├── id (UUID PK)
├── org_id (UUID FK)
├── customer_id (UUID FK)
├── license_plate (text)
├── vin (text)
├── make (text)
├── model (text)
├── year (int)
└── UNIQUE(org_id, license_plate)

appointments
├── id (UUID PK)
├── org_id (UUID FK)
├── customer_id (UUID FK)
├── vehicle_id (UUID FK)
├── scheduled_at (timestamp)
├── service_type (text)
├── status (enum: pending/confirmed/in_progress/completed/cancelled)
├── source (enum: ai_voice/ai_whatsapp/manual/web)
└── ai_conversation_id (text)

conversations
├── id (UUID PK)
├── org_id (UUID FK)
├── customer_id (UUID FK)
├── channel (enum: voice/whatsapp/web)
├── external_id (text) -- Vapi call ID or WhatsApp msg ID
├── phone_number (text)
├── status (enum: active/completed/transferred/failed)
├── summary (text)
└── started_at (timestamp)
```

### RLS Policies (Row Level Security)

```sql
-- Tenant Isolation Pattern
CREATE POLICY "Org member can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (org_id = auth.get_user_org_id());

-- Helper Functions
CREATE FUNCTION auth.get_user_org_id() 
RETURNS UUID AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

## 🔄 Request Flows

### Voice Call Flow (Vapi.ai)

```
1. INCOMING CALL
   Phone → Vapi.ai → POST /api/vapi/webhook
   
   Payload: {
     message: {
       type: 'function-call',
       call: { id: 'call_123', orgId: 'org_456' },
       functionCall: { name: 'check_availability', parameters: {...} }
     }
   }

2. WEBHOOK PROCESSING (Edge Function)
   ├─ Verify orgId from call metadata
   ├─ Route to function handler
   └─ Query Supabase (with RLS)

3. FUNCTION EXECUTION
   ├─ check_availability → Query appointments table
   ├─ book_appointment → Insert new appointment
   └─ lookup_customer → Query customers table

4. RESPONSE
   Return JSON → Vapi.ai → AI Voice Response

5. END OF CALL
   Vapi sends 'end-of-call-report'
   Store transcript in conversation_messages
```

### WhatsApp Message Flow

```
1. INCOMING MESSAGE
   WhatsApp → Meta Cloud API → POST /api/whatsapp/webhook
   
   Payload: {
     entry: [{
       changes: [{
         value: {
           messages: [{ from: '39333...', text: { body: 'Ciao' } }]
         }
       }]
     }]
   }

2. PROCESSING
   ├─ Find organization by WhatsApp number
   ├─ Find or create customer
   ├─ Get conversation history
   └─ Generate AI response (OpenAI)

3. RESPONSE
   POST to Meta Graph API
   Customer receives WhatsApp message

4. STORE
   Save message to conversation_messages
```

---

## 🔐 Security Architecture

### Multi-Layer Security

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Network Security                                    │
│   - HTTPS/TLS 1.3 (Vercel Edge)                             │
│   - DDoS protection (Cloudflare/Vercel)                     │
│   - Webhook signature verification                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Application Security                                │
│   - Supabase Auth (JWT)                                     │
│   - Middleware auth checks                                  │
│   - Input validation (Zod)                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Data Security (RLS)                                 │
│   - Row Level Security policies                             │
│   - Tenant isolation at database level                      │
│   - Automatic scoping via org_id                            │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Performance

### Latency Budgets

| Component | Target | Actual |
|-----------|--------|--------|
| Voice AI Response | < 500ms | ~390ms |
| WhatsApp Response | < 2s | ~1.2s |
| Dashboard Load | < 1.5s | ~0.8s |
| DB Query (with RLS) | < 50ms | ~15ms |

### Optimization Techniques

- **Edge Functions**: Vercel Edge for webhooks (low latency)
- **RLS Indexing**: All policy columns indexed
- **Streaming**: Next.js 15 streaming SSR
- **Caching**: Supabase Realtime for live updates

---

## 📊 Scalability

### Scaling Strategy

```
Users (Officine)          Infrastructure Response
─────────────────────────────────────────────────────────
0-100                     Supabase free tier
                          Vercel hobby (€0)
                          
100-1,000                 Supabase Pro ($25/mo)
                          Vercel Pro ($20/mo)
                          
1,000-10,000              Supabase Enterprise
                          Vercel Enterprise
                          Read replicas
```

---

## 🚀 Deployment

### Environments

```
Development         Staging              Production
─────────────────────────────────────────────────────────────
Local (npm run dev)  Vercel Preview       Vercel Production
Supabase local       Supabase project     Supabase project
```

### Deployment Flow

```
1. Push to main
   → GitHub Actions: Run tests
   
2. Tests pass
   → Deploy to Staging
   → Run smoke tests
   
3. Manual approval
   → Deploy to Production
   → Verify health checks
```

---

## 📈 Observability

### Logging

```typescript
{
  timestamp: "2026-02-18T10:30:00.000Z",
  level: "info",
  service: "voice-gateway",
  orgId: "org_123",
  conversationId: "conv_456",
  message: "Appointment booked via AI",
  metadata: {
    customerPhone: "+393331234567",
    scheduledAt: "2026-02-20T09:00:00Z",
    serviceType: "tagliando"
  }
}
```

### Key Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| Voice Latency | < 500ms | > 800ms |
| WhatsApp Response | < 2s | > 3s |
| Error Rate | < 0.1% | > 1% |
| DB CPU | < 70% | > 90% |

---

**See Also:**
- [README.md](./README.md) - Project overview
- [PROJECT-SUMMARY.md](./PROJECT-SUMMARY.md) - Implementation status
- [KIMI.md](./KIMI.md) - Development context
