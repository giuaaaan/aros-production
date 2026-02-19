-- Fix RLS to allow reading
DROP POLICY IF EXISTS "allow_all" ON organizations;
DROP POLICY IF EXISTS "Allow all" ON organizations;

CREATE POLICY "allow_all" ON organizations FOR ALL USING (true);

-- Also fix profiles and customers
DROP POLICY IF EXISTS "allow_all_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_all_customers" ON customers;

CREATE POLICY "allow_all_profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "allow_all_customers" ON customers FOR ALL USING (true);
