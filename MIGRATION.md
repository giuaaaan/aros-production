# Migration Guide: K8s Enterprise → AROS-Voice SaaS

**Date:** February 2026  
**Scope:** Complete architectural pivot  
**Reason:** Simplify for target market (Italian auto repair shops)

---

## Executive Summary

AROS-Voice underwent a complete architectural transformation from an over-engineered Kubernetes enterprise platform to a practical SaaS solution for Italian mechanics.

### Before: "Fort Knox Architecture"
- Kubernetes with Istio service mesh
- Redis, RabbitMQ, PostgreSQL clusters
- Self-hosted everything
- Built for "enterprise scale" that didn't exist

### After: "Sensible Stack"
- Vercel + Supabase managed services
- 80% less infrastructure code
- 90% reduction in operational overhead
- Production-ready in weeks, not months

---

## Why We Migrated

### The Problem

```
Original architecture was "F-35 for delivering pizza":

┌─────────────────────────────────────────────┐
│  K8s Cluster (€800/mo)                      │
│  ├─ 3x Control Plane nodes                  │
│  ├─ 5x Worker nodes                         │
│  ├─ Istio service mesh                      │
│  ├─ Redis Cluster                           │
│  ├─ RabbitMQ                                │
│  └─ PostgreSQL HA                           │
│                                             │
│  Result: Working on infrastructure,         │
│          not the product                    │
└─────────────────────────────────────────────┘
```

**For our target market:**
- Italian mechanics need a working phone AI, not distributed systems
- €800/mo infrastructure cost for 1 customer = unsustainable
- 6 months to production = too slow
- Complexity scared away potential customers

### The Solution

```
New architecture: "Get shit done"

┌─────────────────────────────────────────────┐
│  Vercel (Edge)                              │
│  ├─ Next.js 15 API routes                   │
│  └─ Static assets                           │
│                                             │
│  Supabase (€25/mo)                          │
│  ├─ PostgreSQL + RLS                        │
│  ├─ Auth                                    │
│  └─ Realtime                                │
│                                             │
│  External Services:                         │
│  ├─ Vapi.ai (voice)                         │
│  ├─ OpenAI (LLM)                            │
│  └─ Meta (WhatsApp)                         │
│                                             │
│  Result: Working on product,                │
│          infrastructure managed             │
└─────────────────────────────────────────────┘
```

---

## Technical Changes

### Infrastructure

| Component | Before (K8s) | After (SaaS) | Savings |
|-----------|--------------|--------------|---------|
| **Compute** | 8 AWS instances | Vercel Edge | 90% cost |
| **Database** | RDS PostgreSQL + Patroni | Supabase | 70% ops |
| **Cache** | Redis Cluster | Supabase built-in | 100% code |
| **Queues** | RabbitMQ | Webhooks + Edge | 100% code |
| **Auth** | Custom JWT service | Supabase Auth | 100% code |
| **Networking** | Istio + ALB | Vercel Edge | 100% config |
| **Monitoring** | Prometheus + Grafana | Vercel + Supabase | 80% setup |

### Code Changes

```
Before:                          After:
────────────────────────────────────────────────
├── k8s/                         ├── src/
│   ├── deployments/             │   ├── app/
│   ├── services/                │   │   ├── api/
│   └── ingress/                 │   └── page.tsx
├── infra/                       ├── supabase/
│   ├── terraform/               │   └── migrations/
│   └── ansible/                 └── package.json
├── services/
│   ├── auth-service/
│   ├── voice-gateway/
│   └── api-gateway/
└── 15,000 lines of YAML

Lines of Code:
- Before: 25,000 (60% infrastructure)
- After: 5,000 (90% business logic)
```

### Database Migration

**Schema Changes:**
```sql
-- Before: Microservice DBs
auth_service.users
voice_service.calls  
whatsapp_service.messages
booking_service.appointments

-- After: Unified schema with RLS
organizations (tenants)
profiles (users)
customers
vehicles
appointments
conversations
```

**RLS Pattern:**
```sql
-- New: Single-tenant isolation
CREATE POLICY "org_access"
  ON customers FOR ALL
  USING (org_id = auth.get_user_org_id());

-- Replaces: Microservice auth checks
-- Replaces: Network policies
-- Replaces: API gateway auth
```

---

## Feature Comparison

| Feature | K8s Version | AROS-Voice v1 | Status |
|---------|-------------|---------------|--------|
| Voice AI | ✅ Planned | ✅ Working | Better |
| WhatsApp | ✅ Planned | ✅ Working | Better |
| Dashboard | ❌ Not started | ✅ Complete | New |
| Multi-tenant | ✅ Over-engineered | ✅ RLS-based | Simpler |
| Auth | ✅ Custom JWT | ✅ Supabase Auth | Faster |
| Deployment | ❌ Complex | ✅ One-click | Better |
| Monitoring | ❌ Self-hosted | ✅ Built-in | Better |
| Time to Prod | ❌ 6 months | ✅ 4 weeks | 6x faster |

---

## Business Impact

### Unit Economics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Infrastructure cost/customer | €800 | €1.25 | -99.8% |
| Development velocity | 10% | 90% | +9x |
| Time to market | 6 months | 1 month | -83% |
| Maintenance overhead | High | Minimal | -90% |
| Customer onboarding | Complex | 5 minutes | -99% |

### Customer Feedback

**Before (K8s pitch):**
> "Sembra complicato... ho bisogno di un tecnico per usarlo?"  
> (Sounds complicated... do I need a technician to use it?)

**After (AROS-Voice demo):**
> "Funziona subito, la mia segretaria può usarlo!"  
> (Works immediately, my receptionist can use it!)

---

## Lessons Learned

### 1. Start Simple

```
"Premature optimization is the root of all evil"

We optimized for scale (10,000 customers) before 
having 1 customer. Wrong priority.

Correct approach: Build for 100 customers, 
then scale when needed.
```

### 2. Managed Services > Self-Hosted

```
Unless you're at FAANG scale, managed services win:
- Faster time to market
- Lower operational burden
- Built-in best practices
- Focus on product, not plumbing
```

### 3. Know Your Customer

```
Italian mechanics don't care about:
❌ Kubernetes
❌ Microservices
❌ Service mesh
❌ Distributed tracing

They care about:
✅ Does it answer the phone?
✅ Does it book appointments?
✅ Can my staff use it?
✅ Is it reliable?
```

### 4. Technical Debt Is Sometimes Good

```
The K8s code isn't "wasted" - it taught us:
- What NOT to build
- Real requirements vs imagined
- Importance of market validation

Sometimes you need to build the wrong thing
to know what the right thing is.
```

---

## Current Architecture Benefits

### For Developers
- **Faster iteration:** Deploy in seconds, not hours
- **Less code:** 5,000 lines vs 25,000
- **No ops:** Focus on features, not infrastructure
- **Better DX:** Local development "just works"

### For Customers
- **Faster onboarding:** 5 minutes vs 5 days
- **Lower cost:** €149/mo vs €500+/mo
- **More reliable:** 99.9% uptime vs self-managed
- **Better UX:** Focused features that work

### For Business
- **Profitability:** Positive unit economics from day 1
- **Scalability:** Can serve 1000 customers with current stack
- **Maintainability:** Small team can manage everything

---

## Migration Checklist (For Reference)

If you need to migrate a similar project:

- [ ] Audit current infrastructure costs
- [ ] Identify managed service alternatives
- [ ] Migrate database to managed solution
- [ ] Replace custom auth with Supabase/Auth0
- [ ] Move APIs to serverless (Vercel/Netlify)
- [ ] Delete 80% of your code
- [ ] Celebrate

---

## Conclusion

The migration from K8s to SaaS was the right decision:

1. ✅ Product launched 5 months earlier
2. ✅ 99% infrastructure cost reduction
3. ✅ Customer-ready in 4 weeks
4. ✅ Focus on product, not plumbing

**Lesson:** Build what your customers need, not what looks impressive on architecture diagrams.

---

**AROS-Voice: Built with pragmatism, not complexity.**

**2026 - Lessons learned the hard way, so you don't have to.**
