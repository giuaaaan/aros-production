-- Clean seed migration - Idempotent
-- Only inserts if table is empty

DO $$
DECLARE
    org_count INT;
BEGIN
    -- Check current count
    SELECT COUNT(*) INTO org_count FROM organizations;
    
    RAISE NOTICE 'Current organizations count: %', org_count;
    
    IF org_count = 0 THEN
        RAISE NOTICE 'Inserting seed data...';
        
        INSERT INTO organizations (id, name, slug, phone_number, whatsapp_number, email, address, city, postal_code, subscription_tier, subscription_status, created_at, updated_at) VALUES
            ('10000000-0000-0000-0000-000000000001', 'Officina Demo Milano', 'officina-demo-milano', '+3902123456789', '+3902123456789', 'demo@officinamilano.it', 'Via Roma 123', 'Milano', '20121', 'professional', 'active', NOW(), NOW()),
            ('10000000-0000-0000-0000-000000000002', 'Car Service Bianchi', 'car-service-bianchi', '+3902987654321', '+3902987654321', 'info@carservicebianchi.it', 'Via Milano 456', 'Roma', '00100', 'starter', 'active', NOW(), NOW()),
            ('10000000-0000-0000-0000-000000000003', 'Moto Garage Verdi', 'moto-garage-verdi', '+390211223344', '+390211223344', 'contatti@motogarageverdi.it', 'Corso Torino 789', 'Torino', '10100', 'enterprise', 'active', NOW(), NOW());
            
        RAISE NOTICE 'Inserted 3 organizations';
    ELSE
        RAISE NOTICE 'Organizations already exist, skipping seed';
    END IF;
END $$;

-- Verify
SELECT COUNT(*) as total_organizations FROM organizations;
