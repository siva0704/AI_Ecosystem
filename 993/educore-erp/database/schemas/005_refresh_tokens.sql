-- ============================================================================
-- EduCore ERP — Migration 005: Refresh Token Store
--
-- Stores server-side refresh token records for sliding session auth.
-- Access tokens: 15m JWT (stateless, in Authorization header)
-- Refresh tokens: 7d (stored here + in httpOnly cookie)
--
-- On /api/auth/refresh:
--   1. Validate cookie token exists in this table
--   2. Check expiry + is_revoked
--   3. Issue new 15m access token + rotate refresh token
--
-- Security considerations:
--   - Refresh tokens are rotated on every use (prevents replay)
--   - All tokens for a user are revocable (logout-all)
--   - No RLS on this table — it's access-controlled at the app level
-- ============================================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  token_hash    VARCHAR(255) NOT NULL UNIQUE,  -- SHA-256 of the raw token
  expires_at    TIMESTAMP WITH TIME ZONE NOT NULL,
  is_revoked    BOOLEAN DEFAULT FALSE NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_used_at  TIMESTAMP WITH TIME ZONE,
  user_agent    TEXT,
  ip_address    INET
);

-- Index for fast lookup by hash (used on every /refresh call)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- Index for revoking all tokens for a user (logout-all)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- Cleanup: auto-delete expired tokens older than 8 days (background job target)
COMMENT ON TABLE refresh_tokens IS 'Server-side refresh token store. Rotate on every use. 7-day expiry.';

-- Grant app role access (no RLS needed — all access via app logic with user_id)
GRANT SELECT, INSERT, UPDATE ON TABLE refresh_tokens TO educore_app;
GRANT USAGE ON SEQUENCE refresh_tokens_token_id_seq TO educore_app;
