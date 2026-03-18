-- Migration 008: Named multi-token API keys
-- Replaces single api_key per user (user_id as PK) with named tokens (id as PK)

ALTER TABLE api_keys ADD COLUMN id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE api_keys ADD COLUMN name TEXT NOT NULL DEFAULT 'default';

ALTER TABLE api_keys DROP CONSTRAINT api_keys_pkey;
ALTER TABLE api_keys ADD PRIMARY KEY (id);

CREATE INDEX api_keys_user_id_idx ON api_keys(user_id);

-- Remove column-level defaults; enforced at application layer
ALTER TABLE api_keys ALTER COLUMN id DROP DEFAULT;
ALTER TABLE api_keys ALTER COLUMN name DROP DEFAULT;
