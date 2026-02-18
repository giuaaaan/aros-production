-- ============================================================
-- AROS - PROFESSIONAL COMPLETE SETUP
-- Best Practice: Check tables before creating policies
-- ============================================================

-- ============================================================
-- 1. ESTENSIONI
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. TABELLE BASE (CREATE IF NOT EXISTS)
-- ============================================================

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles
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

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    province TEXT,
    country TEXT DEFAULT 'IT',
    vat_number TEXT,
    fiscal_code TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    plate TEXT NOT NULL,
    vin TEXT,
    make TEXT,
    model TEXT,
    year INTEGER,
    engine_code TEXT,
    mileage INTEGER DEFAULT 0,
    last_service_date DATE,
    notes TEXT,
    -- Campi per gestione chiavi
    key_code TEXT,
    key_status TEXT DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    wo_number TEXT NOT NULL,
    wo_year INTEGER NOT NULL,
    customer_id UUID REFERENCES customers(id),
    vehicle_id UUID REFERENCES vehicles(id),
    technician_id UUID REFERENCES profiles(id),
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    description TEXT,
    notes_internal TEXT,
    notes_customer TEXT,
    mileage_in INTEGER,
    mileage_out INTEGER,
    scheduled_date DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    total_amount DECIMAL(10,2) DEFAULT 0,
    -- Campi avanzati
    fermo_tecnico BOOLEAN DEFAULT FALSE,
    pending_decision BOOLEAN DEFAULT FALSE,
    time_tracking_started_at TIMESTAMPTZ,
    time_tracking_paused_at TIMESTAMPTZ,
    time_tracking_total_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, wo_year, wo_number)
);

-- Parts
CREATE TABLE IF NOT EXISTS parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    sku TEXT NOT NULL,
    barcode TEXT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    supplier TEXT,
    manufacturer TEXT,
    cost_price DECIMAL(10,2),
    sell_price DECIMAL(10,2),
    quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    location TEXT,
    compatible_vehicles JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, sku)
);

-- ============================================================
-- 3. TABELLE AVANZATE
-- ============================================================

-- Vehicle Keys
CREATE TABLE IF NOT EXISTS vehicle_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id),
    key_code TEXT NOT NULL,
    status TEXT DEFAULT 'available',
    assigned_to UUID,
    assigned_at TIMESTAMPTZ,
    odl_id UUID,
    org_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle Key Logs
CREATE TABLE IF NOT EXISTS vehicle_key_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_id UUID REFERENCES vehicle_keys(id),
    action TEXT NOT NULL,
    performed_by UUID,
    odl_id UUID,
    notes TEXT,
    org_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technical Stops
CREATE TABLE IF NOT EXISTS technical_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    reason TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    vehicle_immobilized BOOLEAN DEFAULT true,
    reported_by UUID,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    org_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pending Decisions
CREATE TABLE IF NOT EXISTS pending_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    odl_id UUID NOT NULL,
    quote_id UUID,
    customer_id UUID,
    sent_at TIMESTAMPTZ NOT NULL,
    quote_amount DECIMAL(10,2),
    status TEXT DEFAULT 'pending',
    reminder_3d_sent_at TIMESTAMPTZ,
    reminder_7d_sent_at TIMESTAMPTZ,
    reminder_14d_sent_at TIMESTAMPTZ,
    escalated_at TIMESTAMPTZ,
    escalated_to UUID,
    org_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fatture
CREATE TABLE IF NOT EXISTS fatture (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID,
    numero TEXT NOT NULL,
    anno INTEGER NOT NULL,
    data_emissione DATE DEFAULT CURRENT_DATE,
    customer_id UUID,
    odl_id UUID,
    importo_totale DECIMAL(10,2) DEFAULT 0,
    stato_sdi TEXT DEFAULT 'DA_INVIARE',
    sdi_id TEXT,
    sdi_pec TEXT,
    data_invio_sdi TIMESTAMPTZ,
    xml_content TEXT,
    pec_message_id TEXT,
    pec_events JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, anno, numero)
);

-- Fatture Linee
CREATE TABLE IF NOT EXISTS fatture_linee (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fattura_id UUID REFERENCES fatture(id) ON DELETE CASCADE,
    descrizione TEXT NOT NULL,
    quantita DECIMAL(10,2) DEFAULT 1,
    prezzo_unitario DECIMAL(10,2) NOT NULL,
    aliquota_iva DECIMAL(5,2) DEFAULT 22.00,
    importo_totale DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. RLS POLICIES (SOLO SE TABELLE ESISTONO)
-- ============================================================

DO $$
BEGIN
    -- Organizations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all" ON organizations;
        CREATE POLICY "Allow all" ON organizations FOR ALL USING (true);
    END IF;

    -- Profiles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
        CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid());
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
        CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
            EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
        );
    END IF;

    -- Customers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Org members can view customers" ON customers;
        DROP POLICY IF EXISTS "Org members can manage customers" ON customers;
        CREATE POLICY "Org members can view customers" ON customers FOR SELECT 
            USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
        CREATE POLICY "Org members can manage customers" ON customers FOR ALL 
            USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
    END IF;

    -- Vehicles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
        ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Org members can view vehicles" ON vehicles;
        DROP POLICY IF EXISTS "Org members can manage vehicles" ON vehicles;
        CREATE POLICY "Org members can view vehicles" ON vehicles FOR SELECT 
            USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
        CREATE POLICY "Org members can manage vehicles" ON vehicles FOR ALL 
            USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
    END IF;

    -- Work Orders
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_orders') THEN
        ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Org members can view work orders" ON work_orders;
        DROP POLICY IF EXISTS "Org members can manage work orders" ON work_orders;
        CREATE POLICY "Org members can view work orders" ON work_orders FOR SELECT 
            USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
        CREATE POLICY "Org members can manage work orders" ON work_orders FOR ALL 
            USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
    END IF;

    -- Parts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parts') THEN
        ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Org members can view parts" ON parts;
        DROP POLICY IF EXISTS "Org members can manage parts" ON parts;
        CREATE POLICY "Org members can view parts" ON parts FOR SELECT 
            USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
        CREATE POLICY "Org members can manage parts" ON parts FOR ALL 
            USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
    END IF;

    -- Vehicle Keys
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_keys') THEN
        ALTER TABLE vehicle_keys ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Org members can view vehicle_keys" ON vehicle_keys;
        DROP POLICY IF EXISTS "Org members can manage vehicle_keys" ON vehicle_keys;
        CREATE POLICY "Org members can view vehicle_keys" ON vehicle_keys FOR SELECT 
            USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
        CREATE POLICY "Org members can manage vehicle_keys" ON vehicle_keys FOR ALL 
            USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
    END IF;

    -- Vehicle Key Logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_key_logs') THEN
        ALTER TABLE vehicle_key_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Org members can view key_logs" ON vehicle_key_logs;
        CREATE POLICY "Org members can view key_logs" ON vehicle_key_logs FOR SELECT 
            USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
    END IF;

    -- Technical Stops
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'technical_stops') THEN
        ALTER TABLE technical_stops ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Org members can view technical_stops" ON technical_stops;
        DROP POLICY IF EXISTS "Org members can manage technical_stops" ON technical_stops;
        CREATE POLICY "Org members can view technical_stops" ON technical_stops FOR SELECT 
            USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
        CREATE POLICY "Org members can manage technical_stops" ON technical_stops FOR ALL 
            USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
    END IF;

    -- Pending Decisions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_decisions') THEN
        ALTER TABLE pending_decisions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Org members can view pending_decisions" ON pending_decisions;
        DROP POLICY IF EXISTS "Org members can manage pending_decisions" ON pending_decisions;
        CREATE POLICY "Org members can view pending_decisions" ON pending_decisions FOR SELECT 
            USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
        CREATE POLICY "Org members can manage pending_decisions" ON pending_decisions FOR ALL 
            USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
    END IF;

    -- Fatture
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fatture') THEN
        ALTER TABLE fatture ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Org members can view fatture" ON fatture;
        DROP POLICY IF EXISTS "Org members can manage fatture" ON fatture;
        CREATE POLICY "Org members can view fatture" ON fatture FOR SELECT 
            USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
        CREATE POLICY "Org members can manage fatture" ON fatture FOR ALL 
            USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
    END IF;

    -- Fatture Linee
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fatture_linee') THEN
        ALTER TABLE fatture_linee ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Org members can view fatture_linee" ON fatture_linee;
        CREATE POLICY "Org members can view fatture_linee" ON fatture_linee FOR SELECT 
            USING (fattura_id IN (SELECT id FROM fatture WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())));
    END IF;

END $$;

-- ============================================================
-- 5. FUNZIONE EXEC_SQL
-- ============================================================

CREATE OR REPLACE FUNCTION exec_sql(query text) 
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$ 
BEGIN 
    EXECUTE query; 
END; 
$$;

-- ============================================================
-- 6. INDICI
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(org_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_org ON vehicles(org_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_org ON work_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle ON work_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_parts_org ON parts(org_id);
CREATE INDEX IF NOT EXISTS idx_parts_sku ON parts(sku);
CREATE INDEX IF NOT EXISTS idx_fatture_org ON fatture(org_id);
CREATE INDEX IF NOT EXISTS idx_fatture_numero ON fatture(org_id, anno, numero);

-- ============================================================
-- MESSAGGIO DI SUCCESSO
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '✅ AROS PROFESSIONAL SETUP COMPLETATO!';
    RAISE NOTICE '   Tutte le tabelle e policies sono state create correttamente.';
END $$;
