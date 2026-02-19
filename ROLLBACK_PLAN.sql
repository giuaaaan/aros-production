-- ============================================================
-- EMERGENCY ROLLBACK SCRIPT
-- Use only if migration causes issues
-- This restores the database to pre-migration state
-- ============================================================

\echo '🆘 EXECUTING EMERGENCY ROLLBACK'
\echo '================================================'
\echo 'WARNING: This will revert security fixes!'
\echo 'Only use if application is broken.'
\echo '================================================'

-- ============================================================
-- ROLLBACK 1: Restore Permissive Policy (if RLS is blocking)
-- ============================================================
\echo '\n1️⃣  Restoring permissive policy on organizations...'

-- First, drop the restrictive policies
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Admins can manage organizations" ON organizations;

-- Restore original permissive policy
CREATE POLICY "Allow all TEMPORARY" ON organizations
    FOR ALL USING (true);

\echo '✅ Organizations policy restored to permissive mode'

-- ============================================================
-- ROLLBACK 2: Disable RLS on new tables (if causing issues)
-- ============================================================
\echo '\n2️⃣  Disabling RLS on advanced tables...'

ALTER TABLE vehicle_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE technical_stops DISABLE ROW LEVEL SECURITY;
ALTER TABLE pending_decisions DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_key_logs DISABLE ROW LEVEL SECURITY;

\echo '✅ RLS disabled on advanced tables'

-- ============================================================
-- ROLLBACK 3: Restore deleted records (undo soft delete)
-- ============================================================
\echo '\n3️⃣  Restoring soft-deleted records...'

-- Restore all soft-deleted records
UPDATE organizations SET deleted_at = NULL WHERE deleted_at IS NOT NULL;
UPDATE profiles SET deleted_at = NULL WHERE deleted_at IS NOT NULL;
UPDATE customers SET deleted_at = NULL WHERE deleted_at IS NOT NULL;
UPDATE vehicles SET deleted_at = NULL WHERE deleted_at IS NOT NULL;
UPDATE work_orders SET deleted_at = NULL WHERE deleted_at IS NOT NULL;
UPDATE parts SET deleted_at = NULL WHERE deleted_at IS NOT NULL;

\echo '✅ All soft-deleted records restored'

-- ============================================================
-- ROLLBACK 4: Drop new constraints (if blocking inserts)
-- ============================================================
\echo '\n4️⃣  Removing new constraints...'

-- Drop status constraint if it exists
ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS chk_work_orders_status;

-- Drop triggers that might be blocking
DROP TRIGGER IF EXISTS trigger_validate_vin ON vehicles;
DROP TRIGGER IF EXISTS trigger_normalize_plate ON vehicles;

\echo '✅ Constraints and validation triggers removed'

-- ============================================================
-- ROLLBACK 5: Verification
-- ============================================================
\echo '\n5️⃣  Verification...'

SELECT 'Organizations count' as check_name, COUNT(*)::text as result FROM organizations
UNION ALL
SELECT 'Organizations with RLS', relrowsecurity::text FROM pg_class WHERE relname = 'organizations'
UNION ALL
SELECT 'Deleted records remaining', COUNT(*)::text FROM organizations WHERE deleted_at IS NOT NULL;

\echo '\n================================================'
\echo 'ROLLBACK COMPLETE'
\echo '================================================'
\echo 'Status: Database restored to pre-migration state'
\echo 'Action Required: Investigate migration failure before retry'
\echo '================================================'
