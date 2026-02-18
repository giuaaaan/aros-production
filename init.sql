-- ============================================================
-- AROS - Database Initialization Script
-- Creates base tables and inserts demo data
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. ORGANIZZAZIONI
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. CLIENTI
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    
    -- Anagrafica
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    email TEXT,
    phone TEXT,
    
    -- Indirizzo
    address TEXT,
    city TEXT,
    postal_code TEXT,
    province TEXT,
    country TEXT DEFAULT 'IT',
    
    -- Fiscale
    vat_number TEXT,
    fiscal_code TEXT,
    
    -- Note
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. VEICOLI
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Dati veicolo
    plate TEXT NOT NULL,
    vin TEXT,
    make TEXT,
    model TEXT,
    year INTEGER,
    engine_code TEXT,
    
    -- KM e stato
    mileage INTEGER DEFAULT 0,
    last_service_date DATE,
    
    -- Note
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. ORDINI DI LAVORO (ODL)
-- ============================================================
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    
    -- Numero ODL
    wo_number TEXT NOT NULL,
    wo_year INTEGER NOT NULL,
    
    -- Riferimenti
    customer_id UUID REFERENCES customers(id),
    vehicle_id UUID REFERENCES vehicles(id),
    
    -- Stato
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    
    -- Dati
    description TEXT,
    notes_internal TEXT,
    notes_customer TEXT,
    
    -- KM
    mileage_in INTEGER,
    mileage_out INTEGER,
    
    -- Date
    scheduled_date DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    -- Totale
    total_amount DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(org_id, wo_year, wo_number)
);

-- ============================================================
-- 5. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(org_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_org ON vehicles(org_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_org ON work_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle ON work_orders(vehicle_id);

-- ============================================================
-- 6. DEMO DATA
-- ============================================================

-- Organization: Officina Demo
INSERT INTO organizations (id, name, slug, settings)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Officina Demo',
    'officina-demo',
    '{"address": "Via Roma 123, Milano", "phone": "+39 02 1234567", "email": "info@officinademo.it"}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Customer: Mario Rossi
INSERT INTO customers (id, org_id, first_name, last_name, email, phone, address, city, postal_code, province)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Mario',
    'Rossi',
    'mario.rossi@email.it',
    '+39 333 1234567',
    'Via Garibaldi 45',
    'Milano',
    '20121',
    'MI'
)
ON CONFLICT DO NOTHING;

-- Customer: Giulia Bianchi
INSERT INTO customers (id, org_id, first_name, last_name, email, phone, address, city, postal_code, province)
VALUES (
    'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Giulia',
    'Bianchi',
    'giulia.bianchi@email.it',
    '+39 334 7654321',
    'Corso Buenos Aires 88',
    'Milano',
    '20124',
    'MI'
)
ON CONFLICT DO NOTHING;

-- Customer: Marco Verdi (Azienda)
INSERT INTO customers (id, org_id, first_name, last_name, company_name, email, phone, address, city, postal_code, province, vat_number)
VALUES (
    'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Marco',
    'Verdi',
    'Verdi Trasporti Srl',
    'info@verditrasporti.it',
    '+39 02 9876543',
    'Via dell''Industria 12',
    'Milano',
    '20134',
    'MI',
    '12345678901'
)
ON CONFLICT DO NOTHING;

-- Vehicle: Fiat Panda
INSERT INTO vehicles (id, org_id, customer_id, plate, vin, make, model, year, mileage, notes)
VALUES (
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'AB123CD',
    'ZFA31200000567890',
    'Fiat',
    'Panda',
    2019,
    45000,
    'Tagliando ogni 15.000 km'
)
ON CONFLICT DO NOTHING;

-- Vehicle: Volkswagen Golf
INSERT INTO vehicles (id, org_id, customer_id, plate, vin, make, model, year, mileage, notes)
VALUES (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'EF456GH',
    'WVWZZZ1KZ9W123456',
    'Volkswagen',
    'Golf',
    2020,
    32000,
    'Cambio automatico'
)
ON CONFLICT DO NOTHING;

-- Vehicle: Ford Transit (Furgone aziendale)
INSERT INTO vehicles (id, org_id, customer_id, plate, vin, make, model, year, mileage, notes)
VALUES (
    'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'FG789IJ',
    'WF0XXXTTGXYS12345',
    'Ford',
    'Transit',
    2018,
    125000,
    'Furgone aziendale - manutenzione frequente'
)
ON CONFLICT DO NOTHING;

-- Work Order: ODL 2026-0001 (In attesa)
INSERT INTO work_orders (id, org_id, wo_number, wo_year, customer_id, vehicle_id, status, priority, description, mileage_in, scheduled_date, total_amount)
VALUES (
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '0001',
    2026,
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    'pending',
    'medium',
    'Tagliando ordinario + sostituzione pastiglie freni anteriori',
    45000,
    '2026-02-20',
    350.00
)
ON CONFLICT DO NOTHING;

-- Work Order: ODL 2026-0002 (In corso)
INSERT INTO work_orders (id, org_id, wo_number, wo_year, customer_id, vehicle_id, status, priority, description, mileage_in, started_at, total_amount)
VALUES (
    'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a99',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '0002',
    2026,
    'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    'in_progress',
    'high',
    'Problema cambio automatico - scatti in scalata',
    32000,
    NOW() - INTERVAL '2 hours',
    850.00
)
ON CONFLICT DO NOTHING;

-- Work Order: ODL 2026-0003 (Completato)
INSERT INTO work_orders (id, org_id, wo_number, wo_year, customer_id, vehicle_id, status, priority, description, mileage_in, started_at, completed_at, delivered_at, total_amount)
VALUES (
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '0003',
    2026,
    'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
    'completed',
    'medium',
    'Sostituzione kit frizione',
    124500,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    1250.00
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ✅ DEMO DATA INSERTED SUCCESSFULLY
-- ============================================================
