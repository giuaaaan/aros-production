-- FINAL DATA SEED
-- Drops all conflicting policies and seeds data

-- Clean up conflicting policies
DROP POLICY IF EXISTS "Allow all" ON organizations;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Org members can view customers" ON customers;
DROP POLICY IF EXISTS "Org members can manage customers" ON customers;

-- Create permissive policy for debugging
CREATE POLICY "Allow all" ON organizations FOR ALL USING (true);

-- Seed data if empty
DO $$
DECLARE
    org_count INT;
BEGIN
    SELECT COUNT(*) INTO org_count FROM organizations;
    
    IF org_count = 0 THEN
        RAISE NOTICE 'SEEDING DATABASE';
        
        INSERT INTO organizations (id, name, slug, phone_number, whatsapp_number, email, address, city, postal_code, subscription_tier, subscription_status, created_at, updated_at) VALUES
            ('z0000000-0000-0000-0000-000000000001', 'Officina Demo Milano', 'officina-demo-milano', '+3902123456789', '+3902123456789', 'demo@officinamilano.it', 'Via Roma 123', 'Milano', '20121', 'professional', 'active', NOW(), NOW()),
            ('z0000000-0000-0000-0000-000000000002', 'Car Service Bianchi', 'car-service-bianchi', '+3902987654321', '+3902987654321', 'info@carservicebianchi.it', 'Via Milano 456', 'Roma', '00100', 'starter', 'active', NOW(), NOW()),
            ('z0000000-0000-0000-0000-000000000003', 'Moto Garage Verdi', 'moto-garage-verdi', '+390211223344', '+390211223344', 'contatti@motogarageverdi.it', 'Corso Torino 789', 'Torino', '10100', 'enterprise', 'active', NOW(), NOW());
            
        RAISE NOTICE 'SEEDED 3 ORGANIZATIONS';
    ELSE
        RAISE NOTICE 'SKIPPED: % organizations exist', org_count;
    END IF;
END $$;

-- Verify
SELECT COUNT(*) as total_orgs FROM organizations;
