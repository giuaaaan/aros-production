-- NUCLEAR RESET - Complete rebuild

-- Step 1: Disable RLS completely
ALTER TABLE IF EXISTS organizations DISABLE ROW LEVEL SECURITY;

-- Step 2: Truncate and reset
TRUNCATE TABLE organizations RESTART IDENTITY CASCADE;

-- Step 3: Insert fresh data
INSERT INTO organizations (
    id, name, slug, phone_number, whatsapp_number, 
    email, address, city, postal_code, province, 
    vat_number, subscription_tier, subscription_status, 
    created_at, updated_at
) VALUES 
('z0000000-0000-0000-0000-000000000001', 'Officina Demo Milano', 'officina-demo-milano', '+3902123456789', '+3902123456789', 'demo@officinamilano.it', 'Via Roma 123', 'Milano', '20121', 'MI', '12345678901', 'professional', 'active', NOW(), NOW()),
('z0000000-0000-0000-0000-000000000002', 'Car Service Bianchi', 'car-service-bianchi', '+3902987654321', '+3902987654321', 'info@carservicebianchi.it', 'Via Milano 456', 'Roma', '00100', 'RM', '10987654321', 'starter', 'active', NOW(), NOW()),
('z0000000-0000-0000-0000-000000000003', 'Moto Garage Verdi', 'moto-garage-verdi', '+390211223344', '+390211223344', 'contatti@motogarageverdi.it', 'Corso Torino 789', 'Torino', '10100', 'TO', '11111111111', 'enterprise', 'active', NOW(), NOW());

-- Step 4: Re-enable RLS with permissive policy
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON organizations;
DROP POLICY IF EXISTS "Allow all" ON organizations;
CREATE POLICY "allow_all" ON organizations FOR ALL USING (true);

-- Verify
SELECT 'SEED COMPLETE' as status, COUNT(*) as total FROM organizations;
