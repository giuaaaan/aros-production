# KIMI.md - AROS-Voice Development Context

**Last Updated:** February 2026  
**Project:** AROS-Voice - AI Receptionist for Italian Auto Repair Shops  
**Status:** ✅ Production Ready v1.0

---

## 🎯 PROJECT OVERVIEW

AROS-Voice is a SaaS platform that provides AI-powered receptionist services for Italian auto repair shops. The system handles phone calls and WhatsApp messages, books appointments, and manages customer relationships.

### Business Model
- **Pricing:** €79-299/month per officina
- **Target:** 1,000 customers by end of 2026
- **Revenue Target:** €1.8M ARR

---

## 🏗️ ARCHITECTURE DECISIONS

### Why This Stack?

| Choice | Reason | Alternative Rejected |
|--------|--------|---------------------|
| **Next.js 15** | App Router, RSC, API routes | Next.js 14 (Pages Router) |
| **Supabase** | Managed Postgres + Auth + Realtime | AWS RDS + Cognito |
| **Vapi.ai** | Managed voice platform | Self-hosted (too complex) |
| **Vercel** | Edge deployment, scale to zero | Kubernetes (overkill) |
| **OpenAI** | Best Italian understanding | Claude, Mistral |

### Key Principles

1. **Sensible Stack Over Enterprise**
   - K8s was overkill for 1000 customers
   - Managed services reduce ops overhead
   - Focus on product, not infrastructure

2. **Tenant Isolation First**
   - Every table has org_id
   - RLS policies prevent data leakage
   - No cross-tenant queries

3. **Edge-First**
   - Webhooks at edge (low latency)
   - Server Components for perf
   - Minimal client-side JS

---

## 📦 MONOREPO STRUCTURE

```
ai-aros-production/
├── apps/
│   └── voice-dashboard/           # MAIN APP ✅
│       ├── src/
│       │   ├── app/               # Next.js App Router
│       │   │   ├── api/           # API Routes
│       │   │   │   ├── vapi/      # Voice webhook
│       │   │   │   └── whatsapp/  # WhatsApp webhook
│       │   │   ├── dashboard/     # Dashboard UI
│       │   │   ├── login/         # Auth pages
│       │   │   └── ...
│       │   ├── components/        # React components
│       │   └── lib/               # Utilities
│       ├── supabase/
│       │   └── migrations/        # DB schema
│       └── package.json
│
├── packages/                      # SHARED MODULES
│   ├── agents/                    # AI logic
│   ├── safety/                    # Guardrails
│   └── semantic-cache/            # Cache
│
└── docs/                          # Documentation
```

---

## 🔐 RLS PATTERNS

### Best Practices (2026)

```sql
-- ✅ GOOD: Use helper function
CREATE POLICY "Org access"
  ON table FOR ALL
  TO authenticated
  USING (org_id = auth.get_user_org_id());

-- ✅ GOOD: Reusable helper
CREATE FUNCTION auth.get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ❌ BAD: Subquery per row (slow)
USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()))
```

### Tables Structure

Every table must have:
1. `org_id UUID NOT NULL` (tenant reference)
2. `created_at/updated_at` timestamps
3. RLS policies for tenant isolation
4. Index on `org_id`

---

## 🤖 AI INTEGRATION

### Vapi.ai (Voice)

```typescript
// Webhook handler structure
export async function POST(req: Request) {
  const payload = await req.json();
  const { message } = payload;
  
  if (message.type === 'tool-calls') {
    // Execute tools
  }
}

// Tools available
const tools = {
  check_availability: 'Check slot liberi',
  book_appointment: 'Prenota appuntamento',
  lookup_customer: 'Cerca cliente',
  transfer_to_human: 'Passa ad operatore'
};
```

### OpenAI (WhatsApp)

```typescript
// Message generation
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: aiConfig.system_prompt },
    ...conversationHistory,
    { role: 'user', content: message }
  ]
});
```

---

## 🗄️ DATABASE PATTERNS

### Supabase Client Usage

```typescript
// Server (with service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Client (with user auth)
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Query Patterns

```typescript
// ✅ Always filter by org_id
const { data } = await supabase
  .from('customers')
  .select('*')
  .eq('org_id', orgId); // Required

// ✅ RLS handles security, but explicit filter for performance
```

---

## 🧪 DEVELOPMENT WORKFLOW

### Local Development

```bash
cd apps/voice-dashboard

# Install dependencies
npm install

# Start dev server
npm run dev

# Database
supabase start
supabase db push
```

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VAPI_PRIVATE_KEY=
OPENAI_API_KEY=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
```

### Testing Strategy

- Unit tests: Vitest
- Integration: Playwright
- E2E: Manual QA (voice is hard to automate)

---

## 🚀 DEPLOYMENT

### Vercel Production

```bash
# Deploy
vercel --prod

# Environment variables set in Vercel dashboard
```

### Supabase

```bash
# Push migrations
supabase db push

# Verify RLS
supabase db reset
```

---

## 📊 BUSINESS LOGIC

### Customer Journey

```
1. Discovery
   → Word of mouth / Trade show / Search
   
2. Onboarding (5 min)
   → Sign up → Setup WhatsApp → Configure hours
   
3. Activation (Day 1)
   → First AI call handled
   → Dashboard accessed
   
4. Retention (Ongoing)
   → Weekly usage
   → Feature adoption
```

### Pricing Tiers

```typescript
const pricing = {
  starter: {
    price: 79,
    calls: 100,
    users: 1,
    whatsapp: true
  },
  professional: {
    price: 149,
    calls: 'unlimited',
    users: 3,
    analytics: true
  },
  enterprise: {
    price: 299,
    calls: 'unlimited',
    users: 'unlimited',
    api: true
  }
};
```

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Vapi Webhook 404
- Ensure `/api/vapi/webhook` route exists
- Check Vapi dashboard URL config
- Verify POST method

### WhatsApp Not Responding
- Check webhook verification (GET)
- Verify WhatsApp token
- Check Meta app settings

### RLS Permission Denied
- Verify RLS policy exists
- Check org_id matches
- Ensure auth.uid() is set

### Supabase Connection Issues
- Check URL and keys
- Verify network access
- Check rate limits

---

## 🔮 FUTURE CONSIDERATIONS

### Technical Debt
- [ ] Migrate to React 19 stable
- [ ] Add comprehensive tests
- [ ] Implement rate limiting
- [ ] Add observability (Sentry)

### Scaling
- [ ] Read replicas for analytics
- [ ] Edge caching for static assets
- [ ] CDN for media uploads

### Features
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] API marketplace

---

## 📚 REFERENCE MATERIALS

- **Vapi Docs:** https://docs.vapi.ai
- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **WhatsApp API:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **Next.js App Router:** https://nextjs.org/docs/app

---

## 🎯 KEY PRINCIPLES

1. **Simplicity First** - No over-engineering
2. **Security by Default** - RLS on everything
3. **Italian Market** - Optimize for local needs
4. **Voice-First** - Best-in-class phone experience
5. **Customer Success** - 5-minute onboarding

---

**Remember: This is a TOOL for mechanics. It should be SIMPLE, RELIABLE, and USEFUL.**

**Built with ❤️ in Italy - 2026**
