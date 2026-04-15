CREATE TABLE api_keys (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  key_preview TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX api_keys_token_hash_idx ON api_keys(token_hash);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE api_keys TO authenticated, service_role;

CREATE POLICY api_keys_user_isolation ON api_keys
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
