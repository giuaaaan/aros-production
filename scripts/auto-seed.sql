-- ============================================================
-- AUTO-SEED SCRIPT - Self-Healing Data Population
-- Netflix-style: If empty, fill with realistic test data
-- Idempotent: Safe to run multiple times
-- ============================================================

\echo '🌱 AUTO-SEED: Checking database state...'

-- ============================================================
-- SEED 1: Organizations (if empty)
-- ============================================================
DO $$
DECLARE
    org_count INT;
BEGIN
    SELECT COUNT(*) INTO org_count FROM organizations;
    
    IF org_count = 0 THEN
        \echo '  → Organizations table empty. Seeding...'
        
        INSERT INTO organizations (id, name, slug, phone_number, whatsapp_number, email, address, city, postal_code, subscription_tier, subscription_status, settings, created_at, updated_at) VALUES
            ('00000000-0000-0000-0000-000000000001', 'Officina Demo Milano', 'officina-demo-milano', '+3902123456789', '+3902123456789', 'demo@officinamilano.it', 'Via Roma 123', 'Milano', '20121', 'professional', 'active', '{"language": "it", "timezone": "Europe/Rome"}', NOW(), NOW()),
            ('00000000-0000-0000-0000-000000000002', 'Car Service Bianchi', 'car-service-bianchi', '+3902987654321', '+3902987654321', 'info@carservicebianchi.it', 'Via Milano 456', 'Roma', '00100', 'starter', 'active', '{"language": "it", "timezone": "Europe/Rome"}', NOW() - INTERVAL '7 days', NOW()),
            ('00000000-0000-0000-0000-000000000003', 'Moto Garage Verdi', 'moto-garage-verdi', '+390211223344', '+390211223344', 'contatti@motogarageverdi.it', 'Corso Torino 789', 'Torino', '10100', 'enterprise', 'active', '{"language": "it", "timezone": "Europe/Rome"}', NOW() - INTERVAL '14 days', NOW());
        
        \echo '  ✅ Seeded 3 organizations';
    ELSE
        \echo '  ✓ Organizations table already populated (' || org_count || ' records)';
    END IF;
END $$;

-- ============================================================
-- SEED 2: Customers (if empty, linked to demo orgs)
-- ============================================================
DO $$
DECLARE
    cust_count INT;
    demo_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    SELECT COUNT(*) INTO cust_count FROM customers;
    
    IF cust_count = 0 THEN
        \echo '  → Customers table empty. Seeding...'
        
        INSERT INTO customers (id, org_id, first_name, last_name, email, phone, address, city, postal_code, created_at, updated_at) VALUES
            (gen_random_uuid(), demo_org_id, 'Mario', 'Rossi', 'mario.rossi@email.it', '+393331234567', 'Via Garibaldi 1', 'Milano', '20121', NOW(), NOW()),
            (gen_random_uuid(), demo_org_id, 'Laura', 'Bianchi', 'laura.bianchi@email.it', '+393332345678', 'Via Dante 2', 'Milano', '20122', NOW(), NOW()),
            (gen_random_uuid(), demo_org_id, 'Giuseppe', 'Verdi', 'giuseppe.verdi@email.it', '+393333456789', 'Corso Buenos Aires 3', 'Milano', '20124', NOW(), NOW()),
            (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'Anna', 'Neri', 'anna.neri@email.it', '+393444567890', 'Via Nazionale 10', 'Roma', '00100', NOW(), NOW()),
            (gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'Marco', 'Gialli', 'marco.gialli@email.it', '+393555678901', 'Via Po 5', 'Torino', '10100', NOW(), NOW());
        
        \echo '  ✅ Seeded 5 customers';
    ELSE
        \echo '  ✓ Customers table already populated (' || cust_count || ' records)';
    END IF;
END $$;

-- ============================================================
-- SEED 3: Vehicles (if empty, linked to customers)
-- ============================================================
DO $$
DECLARE
    veh_count INT;
    first_customer UUID;
BEGIN
    SELECT COUNT(*) INTO veh_count FROM vehicles;
    
    IF veh_count = 0 THEN
        \echo '  → Vehicles table empty. Seeding...'
        
        -- Get first customer from demo org
        SELECT id INTO first_customer FROM customers WHERE org_id = '00000000-0000-0000-0000-000000000001' LIMIT 1;
        
        IF first_customer IS NOT NULL THEN
            INSERT INTO vehicles (id, org_id, customer_id, plate, vin, make, model, year, mileage, created_at, updated_at) VALUES
                (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', first_customer, 'AB123CD', 'WBA1234567890ABCD', 'BMW', 'Serie 3', 2020, 45000, NOW(), NOW()),
                (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', first_customer, 'EF456GH', 'ZAR1234567890EFGH', 'Alfa Romeo', 'Giulia', 2019, 62000, NOW(), NOW()),
                (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', (SELECT id FROM customers WHERE org_id = '00000000-0000-0000-0000-000000000002' LIMIT 1), 'IL789MN', 'WVW1234567890ILMN', 'Volkswagen', 'Golf', 2021, 28000, NOW(), NOW());
            
            \echo '  ✅ Seeded 3 vehicles';
        END IF;
    ELSE
        \echo '  ✓ Vehicles table already populated (' || veh_count || ' records)';
    END IF;
END $$;

-- ============================================================
-- SEED 4: Work Orders (if empty)
-- ============================================================
DO $$
DECLARE
    wo_count INT;
    demo_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    SELECT COUNT(*) INTO wo_count FROM work_orders;
    
    IF wo_count = 0 THEN
        \echo '  → Work Orders table empty. Seeding...'
        
        INSERT INTO work_orders (id, org_id, wo_number, wo_year, customer_id, vehicle_id, status, priority, description, total_amount, created_at, updated_at) VALUES
            (gen_random_uuid(), demo_org_id, '00001', 2026, 
             (SELECT id FROM customers WHERE org_id = demo_org_id LIMIT 1),
             (SELECT id FROM vehicles WHERE org_id = demo_org_id LIMIT 1),
             'completed', 'medium', 'Tagliando completo e sostituzione freni', 450.00, NOW() - INTERVAL '2 days', NOW()),
            
            (gen_random_uuid(), demo_org_id, '00002', 2026,
             (SELECT id FROM customers WHERE org_id = demo_org_id OFFSET 1 LIMIT 1),
             (SELECT id FROM vehicles WHERE org_id = demo_org_id OFFSET 1 LIMIT 1),
             'in_progress', 'high', 'Problema elettronica motore - diagnostica', 120.00, NOW() - INTERVAL '1 day', NOW()),
            
            (gen_random_uuid(), demo_org_id, '00003', 2026,
             (SELECT id FROM customers WHERE org_id = demo_org_id OFFSET 2 LIMIT 1),
             (SELECT id FROM vehicles WHERE org_id = demo_org_id OFFSET 2 LIMIT 1),
             'pending', 'low', 'Cambio gomme stagionali', 80.00, NOW(), NOW());
        
        \echo '  ✅ Seeded 3 work orders';
    ELSE
        \echo '  ✓ Work Orders table already populated (' || wo_count || ' records)';
    END IF;
END $$;

-- ============================================================
-- SEED 5: Parts Inventory (if empty)
-- ============================================================
DO $$
DECLARE
    parts_count INT;
    demo_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    SELECT COUNT(*) INTO parts_count FROM parts;
    
    IF parts_count = 0 THEN
        \echo '  → Parts table empty. Seeding...'
        
        INSERT INTO parts (id, org_id, sku, name, description, category, quantity, min_stock, cost_price, sell_price, created_at, updated_at) VALUES
            (gen_random_uuid(), demo_org_id, 'OLIO-5W40-1L', 'Olio Motore 5W40 1L', 'Olio sintetico per motori benzina/diesel', 'lubrificanti', 45, 10, 8.50, 15.90, NOW(), NOW()),
            (gen_random_uuid(), demo_org_id, 'FILTRO-OLIO-A1', 'Filtro Olio Modello A1', 'Filtro olio compatibile Audi/VW', 'filtri', 30, 5, 4.20, 9.50, NOW(), NOW()),
            (gen_random_uuid(), demo_org_id, 'PASTIGLIE-BREMBO-F', 'Pastiglie Freno Brembo Anteriori', 'Pastiglie freno anteriori alto rendimento', 'freni', 20, 8, 25.00, 49.90, NOW(), NOW()),
            (gen_random_uuid(), demo_org_id, 'BATTERIA-VARTA-60', 'Batteria Varta 60Ah', 'Batteria avviamento 60Ah 540A', 'elettrico', 12, 3, 85.00, 149.00, NOW(), NOW()),
            (gen_random_uuid(), demo_org_id, 'CINGHIA-SERVIZI', 'Cinghia Servizi Universale', 'Cinghia servizi Poly-V 6PK1200', 'motore', 15, 5, 12.50, 28.90, NOW(), NOW());
        
        \echo '  ✅ Seeded 5 parts';
    ELSE
        \echo '  ✓ Parts table already populated (' || parts_count || ' records)';
    END IF;
END $$;

-- ============================================================
-- VERIFICATION: Count final records
-- ============================================================
\echo ''
\echo '📊 SEEDING COMPLETE - Final Counts:'
\echo '─────────────────────────────────────'

SELECT 
    'Organizations' as table_name, 
    COUNT(*) as count 
FROM organizations
UNION ALL
SELECT 
    'Customers', 
    COUNT(*) 
FROM customers
UNION ALL
SELECT 
    'Vehicles', 
    COUNT(*) 
FROM vehicles
UNION ALL
SELECT 
    'Work Orders', 
    COUNT(*) 
FROM work_orders
UNION ALL
SELECT 
    'Parts', 
    COUNT(*) 
FROM parts
ORDER BY table_name;

\echo ''
\echo '✅ Auto-seed complete. Dashboard should now display data.'
\echo '🧪 Test: curl https://admin-dashboard-green-five-49.vercel.app/api/organizations'
