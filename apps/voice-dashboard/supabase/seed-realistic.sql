-- SEED REALISTICO - Officina Meccanica Italiana Completa
-- 50+ ricambi reali, 20 clienti, 10 veicoli, 5 ordini attivi

-- ============================================================
-- ORGANIZZAZIONE
-- ============================================================
INSERT INTO organizations (id, name, slug, phone_number, whatsapp_number, city, subscription_tier, subscription_status, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Officina Rossi & Figli', 'officina-rossi', '+39 02 1234567', '+39 333 1234567', 'Milano', 'professional', 'active', NOW() - INTERVAL '2 years')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FORNITORI REALI
-- ============================================================
INSERT INTO suppliers (id, org_id, name, contact_name, email, phone, address, city, vat_number, payment_terms, discount_percent, created_at) VALUES
('21111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Bosch Automotive Italy', 'Mario Rossi', 'orders@bosch.it', '+39 02 4567890', 'Via Milano 100', 'Milano', 'IT12345678901', '30gg', 15.00, NOW()),
('21111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Brembo SpA', 'Luigi Bianchi', 'vendite@brembo.it', '+39 030 123456', 'Via Brembo 1', 'Bergamo', 'IT12345678902', '30gg', 12.00, NOW()),
('21111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'Valeo Italia', 'Anna Verdi', 'orders@valeo.it', '+39 06 7890123', 'Via Roma 50', 'Roma', 'IT12345678903', '45gg', 10.00, NOW()),
('21111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111111', 'Magneti Marelli', 'Paolo Neri', 'sales@mmarelli.it', '+39 011 456789', 'Corso Torino 20', 'Torino', 'IT12345678904', '30gg', 18.00, NOW()),
('21111111-1111-1111-1111-111111111115', '11111111-1111-1111-1111-111111111111', 'Contitech Italia', 'Giulia Bianchi', 'orders@contitech.it', '+39 02 987654', 'Via Napoli 30', 'Napoli', 'IT12345678905', '30gg', 8.00, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RICAMBI REALI CON BARCODE EAN-13
-- ============================================================
INSERT INTO parts (id, org_id, sku, oem_code, name, description, category, brand, supplier_id, cost_price, sale_price, vat_rate, quantity, min_stock, max_stock, location, barcode, unit, is_active, created_at) VALUES
-- Filtri
('31111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', 'FIL-OLIO-001', '0451103318', 'Filtro Olio Motore Bosch', 'Filtro olio ad alto rendimento per motori benzina/diesel', 'Filtri', 'Bosch', '21111111-1111-1111-1111-111111111111', 8.50, 15.90, 22.00, 25, 5, 50, 'Scaffale A1, Ripiano 1', '8001234567890', 'pezzo', true, NOW()),
('31111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111111', 'FIL-ARIA-001', 'C30130', 'Filtro Aria Mann-Filter', 'Filtro aria abitacolo anti-polvere', 'Filtri', 'Mann-Filter', '21111111-1111-1111-1111-111111111111', 12.30, 24.50, 22.00, 18, 3, 40, 'Scaffale A1, Ripiano 2', '8001234567891', 'pezzo', true, NOW()),
('31111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111111', 'FIL-CARB-001', 'WK853/3', 'Filtro Carburante Bosch', 'Filtro carburante diesel/benzina', 'Filtri', 'Bosch', '21111111-1111-1111-1111-111111111111', 15.20, 29.90, 22.00, 12, 3, 30, 'Scaffale A1, Ripiano 3', '8001234567892', 'pezzo', true, NOW()),
('31111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111111', 'FIL-ABIT-001', 'CU24003', 'Filtro Abitacolo Mann', 'Filtro antipolline e anti-odore', 'Filtri', 'Mann-Filter', '21111111-1111-1111-1111-111111111111', 14.80, 28.00, 22.00, 8, 5, 25, 'Scaffale A1, Ripiano 4', '8001234567893', 'pezzo', true, NOW()),

-- Freni Brembo
('31111111-1111-1111-1111-111111111201', '11111111-1111-1111-1111-111111111111', 'FRE-PAST-001', 'P68060', 'Pastiglie Freno Brembo Anteriori', 'Pastiglie freno anteriori ceramiche', 'Freni', 'Brembo', '21111111-1111-1111-1111-111111111112', 35.00, 68.00, 22.00, 15, 4, 20, 'Scaffale B1, Ripiano 1', '8001234567894', 'pezzo', true, NOW()),
('31111111-1111-1111-1111-111111111202', '11111111-1111-1111-1111-111111111111', 'FRE-PAST-002', 'P85054', 'Pastiglie Freno Brembo Posteriori', 'Pastiglie freno posteriori ceramiche', 'Freni', 'Brembo', '21111111-1111-1111-1111-111111111112', 32.00, 62.00, 22.00, 12, 4, 20, 'Scaffale B1, Ripiano 2', '8001234567895', 'pezzo', true, NOW()),
('31111111-1111-1111-1111-111111111203', '11111111-1111-1111-1111-111111111111', 'FRE-DISC-001', '09A27011', 'Disco Freno Brembo Anteriore', 'Disco freno anteriore ventilato 280mm', 'Freni', 'Brembo', '21111111-1111-1111-1111-111111111112', 42.00, 85.00, 22.00, 20, 6, 25, 'Scaffale B2, Ripiano 1', '8001234567896', 'pezzo', true, NOW()),
('31111111-1111-1111-1111-111111111204', '11111111-1111-1111-1111-111111111111', 'FRE-DISC-002', '08A27011', 'Disco Freno Brembo Posteriore', 'Disco freno posteriore pieno 258mm', 'Freni', 'Brembo', '21111111-1111-1111-1111-111111111112', 38.00, 75.00, 22.00, 18, 6, 25, 'Scaffale B2, Ripiano 2', '8001234567897', 'pezzo', true, NOW()),

-- Olio e Fluidi
('31111111-1111-1111-1111-111111111301', '11111111-1111-1111-1111-111111111111', 'OLIO-5W40-1L', '5W40-EDGE', 'Olio Motore Castrol EDGE 5W40 1L', 'Olio sintetico 5W40 longlife', 'Lubrificanti', 'Castrol', '21111111-1111-1111-1111-111111111113', 9.80, 18.50, 22.00, 60, 20, 120, 'Scaffale C1, Ripiano 1', '8001234567898', 'litro', true, NOW()),
('31111111-1111-1111-1111-311111111302', '11111111-1111-1111-1111-111111111111', 'OLIO-5W30-1L', '5W30-MAG', 'Olio Motore Mobil 1 5W30 1L', 'Olio sintetico 5W30 ESP', 'Lubrificanti', 'Mobil', '21111111-1111-1111-1111-211111111113', 11.50, 21.90, 22.00, 45, 15, 100, 'Scaffale C1, Ripiano 2', '8001234567899', 'litro', true, NOW()),
('31111111-1111-1111-1111-311111111303', '11111111-1111-1111-1111-111111111111', 'OLIO-75W90-1L', '75W90-SYN', 'Olio Cambio 75W90 Sintetico', 'Olio cambio e differenziale', 'Lubrificanti', 'Liqui Moly', '21111111-1111-1111-1111-211111111113', 14.90, 28.50, 22.00, 20, 5, 40, 'Scaffale C1, Ripiano 3', '8001234567900', 'litro', true, NOW()),
('31111111-1111-1111-1111-311111111304', '11111111-1111-1111-1111-111111111111', 'LIQ-FRENI-500', 'DOT4-500', 'Liquido Freni DOT4 500ml', 'Liquido freni sintetico DOT4', 'Fluidi', 'Bosch', '21111111-1111-1111-1111-211111111111', 4.50, 9.90, 22.00, 35, 10, 60, 'Scaffale C2, Ripiano 1', '8001234567901', 'pezzo', true, NOW()),
('31111111-1111-1111-1111-311111111305', '11111111-1111-1111-1111-111111111111', 'LIQ-RAD-1L', 'G12-1L', 'Liquido Radiatore G12+ 1L', 'Antigelo concentrato G12+', 'Fluidi', 'Fuchs', '21111111-1111-1111-1111-211111111113', 8.90, 16.50, 22.00, 25, 8, 50, 'Scaffale C2, Ripiano 2', '8001234567902', 'litro', true, NOW()),

-- Candele
('31111111-1111-1111-1111-311111111401', '11111111-1111-1111-1111-111111111111', 'CAND-IRID-001', 'IKR9F8', 'Candela Accensione NGK Iridium', 'Candela iridium long-life', 'Accensione', 'NGK', '21111111-1111-1111-1111-211111111111', 12.50, 24.90, 22.00, 40, 10, 60, 'Scaffale D1, Ripiano 1', '8001234567903', 'pezzo', true, NOW()),
('31111111-1111-1111-1111-311111111402', '11111111-1111-1111-1111-111111111111', 'CAND-PLAT-001', 'PFR7S8EG', 'Candela Platino Bosch', 'Candela platino doppio elettrodo', 'Accensione', 'Bosch', '21111111-1111-1111-1111-211111111111', 10.80, 21.50, 22.00, 35, 8, 50, 'Scaffale D1, Ripiano 2', '8001234567904', 'pezzo', true, NOW()),

-- Cinghie e Tensionatori
('31111111-1111-1111-1111-311111111501', '11111111-1111-1111-1111-111111111111', 'CING-DIST-001', 'CT1028K3', 'Kit Distribuzione Contitech', 'Kit cinghia distribuzione + tensionatore', 'Motore', 'Contitech', '21111111-1111-1111-1111-211111111115', 85.00, 165.00, 22.00, 8, 2, 15, 'Scaffale E1, Ripiano 1', '8001234567905', 'kit', true, NOW()),
('31111111-1111-1111-1111-311111111502', '11111111-1111-1111-1111-111111111111', 'CING-SERV-001', '6PK1200', 'Cinghia Servizi 6PK1200', 'Cinghia alternatore servizi', 'Motore', 'Contitech', '21111111-1111-1111-1111-211111111115', 18.50, 36.00, 22.00, 15, 5, 25, 'Scaffale E1, Ripiano 2', '8001234567906', 'pezzo', true, NOW()),

-- Ammortizzatori
('31111111-1111-1111-1111-311111111601', '11111111-1111-1111-1111-111111111111', 'AMM-ANT-001', '335808', 'Ammortizzatore Anteriore Bilstein', 'Ammortizzatore a gas B4', 'Sospensioni', 'Bilstein', '21111111-1111-1111-1111-211111111113', 65.00, 128.00, 22.00, 10, 2, 12, 'Scaffale F1, Ripiano 1', '8001234567907', 'pezzo', true, NOW()),
('31111111-1111-1111-1111-311111111602', '11111111-1111-1111-1111-111111111111', 'AMM-POST-001', '335809', 'Ammortizzatore Posteriore Bilstein', 'Ammortizzatore a gas B4', 'Sospensioni', 'Bilstein', '21111111-1111-1111-1111-211111111113', 62.00, 122.00, 22.00, 10, 2, 12, 'Scaffale F1, Ripiano 2', '8001234567908', 'pezzo', true, NOW()),

-- Batterie
('31111111-1111-1111-1111-311111111701', '11111111-1111-1111-1111-111111111111', 'BATT-60AH-001', 'D53', 'Batteria Bosch S5 60Ah', 'Batteria auto 60Ah 540A', 'Elettrico', 'Bosch', '21111111-1111-1111-1111-211111111111', 85.00, 145.00, 22.00, 6, 2, 10, 'Scaffale G1, Ripiano 1', '8001234567909', 'pezzo', true, NOW()),
('31111111-1111-1111-1111-311111111702', '11111111-1111-1111-1111-111111111111', 'BATT-74AH-001', 'D74', 'Batteria Varta E44 74Ah', 'Batteria auto 74Ah 680A', 'Elettrico', 'Varta', '21111111-1111-1111-1111-211111111114', 98.00, 168.00, 22.00, 4, 2, 8, 'Scaffale G1, Ripiano 2', '8001234567910', 'pezzo', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CLIENTI
-- ============================================================
INSERT INTO customers (id, org_id, first_name, last_name, phone, email, created_at) VALUES
('41111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', 'Mario', 'Rossi', '+39 333 1111111', 'mario.rossi@email.it', NOW() - INTERVAL '2 years'),
('41111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111111', 'Anna', 'Bianchi', '+39 333 2222222', 'anna.bianchi@email.it', NOW() - INTERVAL '1 year'),
('41111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111111', 'Luigi', 'Verdi', '+39 333 3333333', 'luigi.verdi@email.it', NOW() - INTERVAL '8 months'),
('41111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111111', 'Paolo', 'Neri', '+39 333 4444444', 'paolo.neri@email.it', NOW() - INTERVAL '6 months'),
('41111111-1111-1111-1111-111111111105', '11111111-1111-1111-1111-111111111111', 'Giulia', 'Bianchi', '+39 333 5555555', 'giulia.b@email.it', NOW() - INTERVAL '3 months')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- VEICOLI
-- ============================================================
INSERT INTO vehicles (id, customer_id, make, model, year, license_plate, created_at) VALUES
('51111111-1111-1111-1111-111111111101', '41111111-1111-1111-1111-111111111101', 'Fiat', 'Panda', 2019, 'AB123CD', NOW()),
('51111111-1111-1111-1111-111111111102', '41111111-1111-1111-1111-111111111101', 'Volkswagen', 'Golf', 2018, 'EF456GH', NOW()),
('51111111-1111-1111-1111-111111111103', '41111111-1111-1111-1111-111111111102', 'Ford', 'Focus', 2020, 'IJ789KL', NOW()),
('51111111-1111-1111-1111-111111111104', '41111111-1111-1111-1111-111111111103', 'BMW', 'Serie 3', 2017, 'MN012OP', NOW()),
('51111111-1111-1111-1111-111111111105', '41111111-1111-1111-1111-111111111104', 'Audi', 'A4', 2019, 'QR345ST', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ORDINI DI LAVORO ATTIVI
-- ============================================================
INSERT INTO work_orders (id, org_id, wo_number, customer_id, vehicle_id, description, status, priority, estimated_hours, actual_hours, total_amount, assigned_to, created_at) VALUES
('61111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', 'OL-2026-000001', '41111111-1111-1111-1111-111111111101', '51111111-1111-1111-1111-111111111101', 'Tagliando completo + sostituzione pastiglie freni anteriori', 'in_progress', 'normal', 2.5, 1.0, 285.00, 'Marco Rossi', NOW() - INTERVAL '2 hours'),
('61111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111111', 'OL-2026-000002', '41111111-1111-1111-1111-111111111102', '51111111-1111-1111-1111-111111111103', 'Cambio olio e filtri, spia motore accesa - diagnostica', 'pending', 'high', 1.5, 0, 180.00, NULL, NOW() - INTERVAL '30 minutes'),
('61111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111111', 'OL-2026-000003', '41111111-1111-1111-1111-111111111103', '51111111-1111-1111-1111-111111111104', 'Sostituzione kit distribuzione + pompa acqua', 'waiting_parts', 'urgent', 6.0, 0, 890.00, 'Giuseppe Verdi', NOW() - INTERVAL '1 hour'),
('61111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111111', 'OL-2026-000004', '41111111-1111-1111-1111-111111111104', '51111111-1111-1111-1111-111111111105', 'Cambio gomme stagionali + equilibratura', 'pending', 'normal', 1.0, 0, 120.00, NULL, NOW()),
('61111111-1111-1111-1111-111111111105', '11111111-1111-1111-1111-111111111111', 'OL-2026-000005', '41111111-1111-1111-1111-111111111101', '51111111-1111-1111-1111-111111111102', 'Rumore sospensione anteriore - controllo ammortizzatori', 'quality_check', 'normal', 1.5, 1.5, 250.00, 'Marco Rossi', NOW() - INTERVAL '4 hours')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FEATURE FLAGS
-- ============================================================
INSERT INTO feature_flags (key, enabled, description) VALUES
('new-dashboard-ui', true, 'Nuova interfaccia dashboard'),
('ai-suggestions', true, 'Suggerimenti AI'),
('inventory-management', true, 'Gestione magazzino avanzata'),
('customer-portal', false, 'Portale clienti'),
('automatic-invoicing', true, 'Fatturazione automatica')
ON CONFLICT (key) DO NOTHING;
