-- ============================================
-- AROS BASE TABLES (Prerequisiti)
-- Creare QUESTO FILE PRIMA di 999_complete_migration.sql
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. ORGANIZZAZIONI
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. UTENTI/PROFILI (già esistenti ma verifichiamo)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id),
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'technician',
    phone TEXT,
    avatar_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CLIENTI
-- ============================================
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

-- ============================================
-- 4. VEICOLI
-- ============================================
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

-- ============================================
-- 5. ORDINI DI LAVORO (ODL)
-- ============================================
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    
    -- Numero ODL
    wo_number TEXT NOT NULL,
    wo_year INTEGER NOT NULL,
    
    -- Riferimenti
    customer_id UUID REFERENCES customers(id),
    vehicle_id UUID REFERENCES vehicles(id),
    technician_id UUID REFERENCES profiles(id),
    
    -- Stato
    status TEXT DEFAULT 'pending', -- pending, in_progress, waiting_parts, completed, invoiced
    priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
    
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

-- ============================================
-- 6. RICAMBI (PARTS)
-- ============================================
CREATE TABLE IF NOT EXISTS parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    
    -- Codici
    sku TEXT NOT NULL,
    barcode TEXT,
    
    -- Descrizione
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    
    -- Fornitore
    supplier TEXT,
    manufacturer TEXT,
    
    -- Prezzi
    cost_price DECIMAL(10,2),
    sell_price DECIMAL(10,2),
    
    -- Giacenza
    quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    location TEXT,
    
    -- Compatibilità
    compatible_vehicles JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(org_id, sku)
);

-- ============================================
-- 7. RLS POLICIES (base)
-- ============================================

-- Organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON organizations; CREATE POLICY "Allow all" ON organizations
    FOR ALL USING (true);

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- Customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view customers"
    ON customers FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Org members can manage customers"
    ON customers FOR ALL
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view vehicles"
    ON vehicles FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Org members can manage vehicles"
    ON vehicles FOR ALL
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Work Orders
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view work orders"
    ON work_orders FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Org members can manage work orders"
    ON work_orders FOR ALL
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Parts
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view parts"
    ON parts FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Org members can manage parts"
    ON parts FOR ALL
    USING (
        org_id IN (
            SELECT org_id FROM profiles WHERE id = auth.uid()
        )
    );

-- ============================================
-- 8. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(org_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_org ON vehicles(org_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_org ON work_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle ON work_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_parts_org ON parts(org_id);
CREATE INDEX IF NOT EXISTS idx_parts_sku ON parts(sku);
