import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const authFilePath = process.env.KAIROS_MCP_AUTH_FILE || join(homedir(), ".codex", "kairos-auth.json");
const clientEnvPath = resolve(process.cwd(), "../client/.env");
const clientEnv = dotenv.config({ path: clientEnvPath }).parsed || {};

const supabaseUrl = process.env.KAIROS_SUPABASE_URL || clientEnv.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.KAIROS_SUPABASE_ANON_KEY || clientEnv.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing Supabase client config. Set KAIROS_SUPABASE_URL and KAIROS_SUPABASE_ANON_KEY or create ${clientEnvPath}.`,
  );
}

const cli = createInterface({ input, output });

try {
  const email = (await cli.question("Kairos email: ")).trim();
  const password = await cli.question("Kairos password: ");

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session?.refresh_token || !data.user?.id) {
    throw new Error(error?.message || "Failed to sign in to Kairos");
  }

  await mkdir(dirname(authFilePath), { recursive: true });
  await writeFile(
    authFilePath,
    JSON.stringify(
      {
        supabaseUrl,
        supabaseAnonKey,
        refreshToken: data.session.refresh_token,
        userId: data.user.id,
        email,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );

  output.write(`Saved Kairos MCP auth to ${authFilePath}\n`);
} finally {
  cli.close();
}
