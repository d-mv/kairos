CREATE TABLE brain_folders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE brain_pages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  folder_id    UUID REFERENCES brain_folders(id) ON DELETE SET NULL,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER brain_folders_updated_at
  BEFORE UPDATE ON brain_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER brain_pages_updated_at
  BEFORE UPDATE ON brain_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX brain_folders_user_id_idx ON brain_folders(user_id);
CREATE INDEX brain_pages_user_id_idx ON brain_pages(user_id);
CREATE INDEX brain_pages_folder_id_idx ON brain_pages(folder_id);

ALTER TABLE brain_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_pages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE brain_folders, brain_pages TO authenticated, service_role;

CREATE POLICY brain_folders_user_isolation ON brain_folders
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY brain_pages_user_isolation ON brain_pages
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
