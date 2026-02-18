-- Create exec_sql function for running migrations via API
-- Run this in Supabase SQL Editor first!

CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Grant access to authenticated users (or service_role only)
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;

-- Alternative: Create a safer version that logs all executions
CREATE TABLE IF NOT EXISTS exec_sql_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash TEXT,
    query_preview TEXT,
    executed_by UUID,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN,
    error_message TEXT
);

-- Create logged version
CREATE OR REPLACE FUNCTION exec_sql_logged(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    query_hash TEXT;
    preview TEXT;
BEGIN
    query_hash := encode(digest(query, 'sha256'), 'hex');
    preview := LEFT(query, 200);
    
    INSERT INTO exec_sql_log (query_hash, query_preview, executed_by, success)
    VALUES (query_hash, preview, auth.uid(), true);
    
    EXECUTE query;
EXCEPTION WHEN OTHERS THEN
    INSERT INTO exec_sql_log (query_hash, query_preview, executed_by, success, error_message)
    VALUES (query_hash, preview, auth.uid(), false, SQLERRM);
    RAISE;
END;
$$;
