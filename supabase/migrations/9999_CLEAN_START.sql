-- CLEAN START - Single migration for data

-- Drop and recreate with data
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS parts CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Create fresh
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    whatsapp_number TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    subscription_tier TEXT DEFAULT 'starter',
    subscription_status TEXT DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
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

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Simple policy
CREATE POLICY "allow_all" ON organizations FOR ALL USING (true);
CREATE POLICY "allow_all_profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "allow_all_customers" ON customers FOR ALL USING (true);

-- INSERT DATA
INSERT INTO organizations (id, name, slug, phone_number, email, city, subscription_tier, subscription_status) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Officina Demo Milano', 'officina-demo-milano', '+3902123456789', 'demo@officinamilano.it', 'Milano', 'professional', 'active'),
    ('22222222-2222-2222-2222-222222222222', 'Car Service Bianchi', 'car-service-bianchi', '+3902987654321', 'info@carservicebianchi.it', 'Roma', 'starter', 'active'),
    ('33333333-3333-3333-3333-333333333333', 'Moto Garage Verdi', 'moto-garage-verdi', '+390211223344', 'contatti@motogarageverdi.it', 'Torino', 'enterprise', 'active');
