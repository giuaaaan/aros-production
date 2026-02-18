-- AROS - FINAL FIX
-- Rimuove policies esistenti e ricrea tutto pulito

-- ============================================================
-- 1. DROP TUTTE LE POLICIES ESISTENTI (se ci sono)
-- ============================================================

-- Organizations
DROP POLICY IF EXISTS "Allow all" ON organizations;

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Customers
DROP POLICY IF EXISTS "Org members can view customers" ON customers;
DROP POLICY IF EXISTS "Org members can manage customers" ON customers;

-- Vehicles
DROP POLICY IF EXISTS "Org members can view vehicles" ON vehicles;
DROP POLICY IF EXISTS "Org members can manage vehicles" ON vehicles;

-- Work Orders
DROP POLICY IF EXISTS "Org members can view work orders" ON work_orders;
DROP POLICY IF EXISTS "Org members can manage work orders" ON work_orders;

-- Parts
DROP POLICY IF EXISTS "Org members can view parts" ON parts;
DROP POLICY IF EXISTS "Org members can manage parts" ON parts;

-- Vehicle Keys
DROP POLICY IF EXISTS "Org members can view vehicle_keys" ON vehicle_keys;
DROP POLICY IF EXISTS "Org members can manage vehicle_keys" ON vehicle_keys;
DROP POLICY IF EXISTS "Org members can view key_logs" ON vehicle_key_logs;

-- Technical Stops
DROP POLICY IF EXISTS "Org members can view technical_stops" ON technical_stops;
DROP POLICY IF EXISTS "Org members can manage technical_stops" ON technical_stops;

-- Pending Decisions
DROP POLICY IF EXISTS "Org members can view pending_decisions" ON pending_decisions;
DROP POLICY IF EXISTS "Org members can manage pending_decisions" ON pending_decisions;

-- Fatture
DROP POLICY IF EXISTS "Org members can view fatture" ON fatture;
DROP POLICY IF EXISTS "Org members can manage fatture" ON fatture;
DROP POLICY IF EXISTS "Org members can view fatture_linee" ON fatture_linee;

-- ============================================================
-- 2. ABILITA RLS SU TUTTE LE TABELLE
-- ============================================================

ALTER TABLE IF EXISTS organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehicle_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehicle_key_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS technical_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pending_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fatture ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fatture_linee ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. CREA LE POLICIES (ora sicuro che non esistono)
-- ============================================================

-- Organizations
CREATE POLICY "Allow all" ON organizations FOR ALL USING (true);

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
);

-- Customers
CREATE POLICY "Org members can view customers" ON customers FOR SELECT 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Org members can manage customers" ON customers FOR ALL 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Vehicles
CREATE POLICY "Org members can view vehicles" ON vehicles FOR SELECT 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Org members can manage vehicles" ON vehicles FOR ALL 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Work Orders
CREATE POLICY "Org members can view work orders" ON work_orders FOR SELECT 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Org members can manage work orders" ON work_orders FOR ALL 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Parts
CREATE POLICY "Org members can view parts" ON parts FOR SELECT 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Org members can manage parts" ON parts FOR ALL 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Vehicle Keys
CREATE POLICY "Org members can view vehicle_keys" ON vehicle_keys FOR SELECT 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Org members can manage vehicle_keys" ON vehicle_keys FOR ALL 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Vehicle Key Logs
CREATE POLICY "Org members can view key_logs" ON vehicle_key_logs FOR SELECT 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Technical Stops
CREATE POLICY "Org members can view technical_stops" ON technical_stops FOR SELECT 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Org members can manage technical_stops" ON technical_stops FOR ALL 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Pending Decisions
CREATE POLICY "Org members can view pending_decisions" ON pending_decisions FOR SELECT 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Org members can manage pending_decisions" ON pending_decisions FOR ALL 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Fatture
CREATE POLICY "Org members can view fatture" ON fatture FOR SELECT 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Org members can manage fatture" ON fatture FOR ALL 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Fatture Linee
CREATE POLICY "Org members can view fatture_linee" ON fatture_linee FOR SELECT 
    USING (fattura_id IN (SELECT id FROM fatture WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())));

-- ============================================================
-- 4. FUNZIONE EXEC_SQL (per future migration)
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
-- MESSAGGIO DI SUCCESSO
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '✅ FINAL FIX COMPLETATO!';
    RAISE NOTICE '   Tutte le policies sono state ricreate correttamente.';
END $$;
