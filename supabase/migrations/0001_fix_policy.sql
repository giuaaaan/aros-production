-- Fix conflicting policies before base tables
DROP POLICY IF EXISTS "Allow all" ON organizations;
