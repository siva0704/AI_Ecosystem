-- ============================================================================
-- EduCore ERP — Migration 003: SECURITY DEFINER auth function
-- 
-- Solves the chicken-and-egg RLS problem during login:
-- The app cannot set app.current_tenant_id before knowing the user's tenant,
-- but RLS requires the setting to query the users table.
--
-- Solution: SECURITY DEFINER function runs as the schema owner (postgres),
-- bypassing RLS only for this specific, auditable, single-row email lookup.
-- The function is read-only (STABLE) and returns only what login needs.
-- ============================================================================

CREATE OR REPLACE FUNCTION authenticate_user(p_email TEXT)
RETURNS TABLE (
  user_id          UUID,
  tenant_id        UUID,
  password_hash    TEXT,
  first_name       TEXT,
  last_name        TEXT,
  role             TEXT,
  tier             SMALLINT,
  subdomain        TEXT,
  is_active        BOOLEAN,
  tenant_display_name TEXT
)
LANGUAGE SQL
SECURITY DEFINER  -- runs as postgres (schema owner), bypasses RLS
STABLE            -- no side effects, same input = same output within a txn
AS $$
  SELECT
    u.user_id,
    u.tenant_id,
    u.password_hash,
    u.first_name,
    u.last_name,
    u.role,
    u.tier,
    u.subdomain,
    u.is_active,
    t.display_name
  FROM users u
  INNER JOIN tenants t ON u.tenant_id = t.tenant_id
  WHERE u.email = p_email
  LIMIT 1;
$$;

-- Grant execute rights to the app role
GRANT EXECUTE ON FUNCTION authenticate_user(TEXT) TO educore_app;

-- Confirm creation
SELECT
  proname AS function_name,
  prosecdef AS security_definer,
  provolatile AS volatility
FROM pg_proc
WHERE proname = 'authenticate_user';
