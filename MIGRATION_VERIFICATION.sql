-- ============================================================
-- POST-MIGRATION VERIFICATION SCRIPT
-- Run this after applying 006_schema_audit_remediation.sql
-- All checks must pass (green) for migration to be considered successful
-- ============================================================

\echo '🔍 STARTING POST-MIGRATION VERIFICATION'
\echo '================================================'

-- ============================================================
-- CHECK 1: RLS Policies (Security)
-- ============================================================
\echo '\n🛡️  CHECK 1: RLS Policies on organizations'
SELECT 
    tablename,
    policyname,
    permissive,
    roles::text,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'organizations'
ORDER BY policyname;

-- Expected: 2 rows (Users can view own organization, Admins can manage organizations)
-- NOT: "Allow all" policy

-- ============================================================
-- CHECK 2: Soft Delete Columns (GDPR)
-- ============================================================
\echo '\n🗑️  CHECK 2: Soft delete (deleted_at) columns'
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'deleted_at'
AND table_name IN ('organizations', 'profiles', 'customers', 'vehicles', 'work_orders', 'parts')
ORDER BY table_name;

-- Expected: 6+ rows with deleted_at columns

-- ============================================================
-- CHECK 3: Performance Indexes
-- ============================================================
\echo '\n⚡ CHECK 3: New performance indexes'
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND (
    indexname LIKE 'idx_%_deleted_at'
    OR indexname LIKE 'idx_%_email'
    OR indexname LIKE 'idx_%_plate'
    OR indexname LIKE 'idx_%_created'
    OR indexname LIKE 'idx_%_org_status'
)
ORDER BY tablename, indexname;

-- Expected: 8+ new indexes

-- ============================================================
-- CHECK 4: Auto-Update Triggers
-- ============================================================
\echo '\n⏰ CHECK 4: Auto-update triggers'
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;

-- Expected: 6+ triggers for auto-updating updated_at

-- ============================================================
-- CHECK 5: RLS Enabled on Tables
-- ============================================================
\echo '\n🔒 CHECK 5: RLS enabled on critical tables'
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname IN (
    'organizations', 'profiles', 'customers', 'vehicles', 
    'work_orders', 'parts', 'vehicle_keys', 'technical_stops',
    'pending_decisions', 'vehicle_key_logs'
)
AND relkind = 'r'
ORDER BY relname;

-- Expected: All tables have rls_enabled = true

-- ============================================================
-- CHECK 6: Views Created
-- ============================================================
\echo '\n👁️  CHECK 6: Active record views'
SELECT 
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
AND viewname LIKE 'active_%'
ORDER BY viewname;

-- Expected: 5 views (active_organizations, active_profiles, etc.)

-- ============================================================
-- CHECK 7: Functions Created
-- ============================================================
\echo '\n🔧 CHECK 7: Helper functions'
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'update_updated_at_column',
    'soft_delete_record',
    'restore_record',
    'cleanup_soft_deleted_records',
    'normalize_email',
    'normalize_vehicle_plate',
    'validate_vin'
)
ORDER BY routine_name;

-- Expected: 7+ functions

-- ============================================================
-- CHECK 8: Monitoring Views
-- ============================================================
\echo '\n📊 CHECK 8: Monitoring views'
SELECT 
    viewname
FROM pg_views
WHERE schemaname = 'public'
AND viewname IN ('table_statistics', 'unused_indexes')
ORDER BY viewname;

-- Expected: 2 views

-- ============================================================
-- CHECK 9: Data Integrity Test
-- ============================================================
\echo '\n✅ CHECK 9: Data integrity sample'
-- Verify organizations table is accessible (RLS working)
SELECT 
    COUNT(*) as org_count,
    COUNT(deleted_at) as deleted_count
FROM organizations;

-- Should return counts without error (RLS must allow admin/system access)

-- ============================================================
-- CHECK 10: Index Usage Check
-- ============================================================
\echo '\n📈 CHECK 10: New index verification'
-- Check that partial indexes have correct WHERE clause
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexdef LIKE '%deleted_at IS NULL%'
LIMIT 5;

-- Expected: Multiple partial indexes with deleted_at filter

-- ============================================================
-- SUMMARY
-- ============================================================
\echo '\n================================================'
\echo 'VERIFICATION SUMMARY'
\echo '================================================'

DO $$
DECLARE
    policy_count INT;
    deleted_at_count INT;
    index_count INT;
    trigger_count INT;
    rls_count INT;
    view_count INT;
    func_count INT;
    all_passed BOOLEAN := true;
BEGIN
    -- Count policies
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'organizations';
    
    -- Count deleted_at columns
    SELECT COUNT(*) INTO deleted_at_count 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND column_name = 'deleted_at';
    
    -- Count new indexes
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND (indexname LIKE 'idx_%_deleted%' OR indexname LIKE 'idx_%_email%' 
         OR indexname LIKE 'idx_%_plate%' OR indexname LIKE 'idx_%_org_status');
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' AND trigger_name LIKE '%updated_at%';
    
    -- Count RLS enabled tables
    SELECT COUNT(*) INTO rls_count 
    FROM pg_class 
    WHERE relname IN ('organizations', 'profiles', 'customers', 'vehicles', 'work_orders', 'parts')
    AND relrowsecurity = true;
    
    -- Count views
    SELECT COUNT(*) INTO view_count 
    FROM pg_views 
    WHERE schemaname = 'public' AND viewname LIKE 'active_%';
    
    -- Count functions
    SELECT COUNT(*) INTO func_count 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('soft_delete_record', 'restore_record', 'update_updated_at_column');
    
    RAISE NOTICE 'Results:';
    RAISE NOTICE '- RLS Policies on organizations: % (expected: 2+)', policy_count;
    RAISE NOTICE '- Soft delete columns: % (expected: 6+)', deleted_at_count;
    RAISE NOTICE '- Performance indexes: % (expected: 8+)', index_count;
    RAISE NOTICE '- Auto-update triggers: % (expected: 6+)', trigger_count;
    RAISE NOTICE '- RLS enabled tables: % (expected: 6+)', rls_count;
    RAISE NOTICE '- Active record views: % (expected: 5+)', view_count;
    RAISE NOTICE '- Helper functions: % (expected: 3+)', func_count;
    
    IF policy_count >= 2 AND deleted_at_count >= 6 AND index_count >= 8 
       AND trigger_count >= 6 AND rls_count >= 6 THEN
        RAISE NOTICE '\n✅ ALL CHECKS PASSED - MIGRATION SUCCESSFUL';
    ELSE
        RAISE NOTICE '\n⚠️  SOME CHECKS FAILED - REVIEW OUTPUT ABOVE';
    END IF;
END $$;

\echo '\n================================================'
\echo 'VERIFICATION COMPLETE'
\echo '================================================'
