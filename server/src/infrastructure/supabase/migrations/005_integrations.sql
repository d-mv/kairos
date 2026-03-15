CREATE TABLE integration_connections (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider                TEXT NOT NULL CHECK (provider IN ('google', 'todoist')),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token_encrypted  TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  scopes                  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  expires_at              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

CREATE TRIGGER integration_connections_updated_at
  BEFORE UPDATE ON integration_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX integration_connections_user_id_idx ON integration_connections(user_id);
CREATE INDEX integration_connections_provider_idx ON integration_connections(provider);

ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE integration_connections TO authenticated, service_role;

CREATE POLICY integration_connections_user_isolation ON integration_connections
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
