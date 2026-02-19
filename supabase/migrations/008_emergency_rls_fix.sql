-- EMERGENCY RLS ROLLBACK
-- Reverts restrictive policies that may be blocking API access

-- Drop restrictive policies on organizations
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
DROP POLICY IF EXISTS "Admins can manage organizations" ON organizations;

-- Restore permissive policy temporarily for debugging
CREATE POLICY "Allow all" ON organizations
    FOR ALL USING (true);

-- Log the change
DO $$
BEGIN
    RAISE NOTICE 'EMERGENCY: RLS policies reverted to permissive mode';
END $$;
