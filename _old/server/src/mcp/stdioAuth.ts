import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

type AuthFileShape = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  refreshToken?: string;
};

type SupabaseRefreshClient = {
  auth: {
    refreshSession: (input: { refresh_token: string }) => Promise<{
      data: { session: { user?: { id?: string } } | null };
      error: { message: string } | null;
    }>;
  };
};

type ResolveKairosMcpUserIdOptions = {
  authFilePath?: string;
  readFile?: (path: string, encoding: "utf8") => Promise<string>;
  createSupabaseClient?: (url: string, anonKey: string) => SupabaseRefreshClient;
};

const defaultAuthFilePath = join(homedir(), ".codex", "kairos-auth.json");

export async function resolveKairosMcpUserId({
  authFilePath = process.env["KAIROS_MCP_AUTH_FILE"] ?? defaultAuthFilePath,
  readFile: readFileImpl = readFile,
  createSupabaseClient = (url, anonKey) =>
    createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }) as SupabaseRefreshClient,
}: ResolveKairosMcpUserIdOptions = {}): Promise<string> {
  const raw = await readFileImpl(authFilePath, "utf8");
  const parsed = JSON.parse(raw) as AuthFileShape;

  if (!parsed.supabaseUrl || !parsed.supabaseAnonKey || !parsed.refreshToken) {
    throw new Error(`Invalid Kairos MCP auth file at ${authFilePath}`);
  }

  const client = createSupabaseClient(parsed.supabaseUrl, parsed.supabaseAnonKey);
  const { data, error } = await client.auth.refreshSession({ refresh_token: parsed.refreshToken });

  if (error || !data.session?.user?.id) {
    throw new Error("Failed to refresh Kairos MCP auth session");
  }

  return data.session.user.id;
}
