#!/bin/bash
set -e

echo "🚀 Setup AROS in corso..."

# Attendi PostgreSQL
sleep 5

# Crea tabelle
PGPASSWORD=postgres psql -U postgres -d aros << 'SQL'
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate TEXT NOT NULL,
    model TEXT,
    brand TEXT,
    customer_id UUID REFERENCES customers(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number TEXT,
    status TEXT DEFAULT 'pending',
    description TEXT,
    customer_id UUID REFERENCES customers(id),
    vehicle_id UUID REFERENCES vehicles(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO organizations (id, name) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Officina Demo')
ON CONFLICT DO NOTHING;

INSERT INTO customers (id, name, phone, organization_id) VALUES 
    ('22222222-2222-2222-2222-222222222222', 'Mario Rossi', '3331234567', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

INSERT INTO vehicles (id, plate, model, brand, customer_id, organization_id) VALUES 
    ('44444444-4444-4444-4444-444444444444', 'AB123CD', 'Panda', 'Fiat', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

INSERT INTO work_orders (id, number, status, description, customer_id, vehicle_id, organization_id) VALUES 
    ('66666666-6666-6666-6666-666666666666', 'OT-001', 'in_progress', 'Cambio olio', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;
SQL

# Crea .env files
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aros" > apps/voice-dashboard/.env
echo "NEXT_PUBLIC_SUPABASE_URL=http://localhost" >> apps/voice-dashboard/.env
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aros" > apps/admin-dashboard/.env
echo "NEXT_PUBLIC_SUPABASE_URL=http://localhost" >> apps/admin-dashboard/.env

# Installa dipendenze
pnpm install

echo "✅ Setup completato!"
