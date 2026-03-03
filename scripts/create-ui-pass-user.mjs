import { config as loadEnv } from "dotenv";

loadEnv();
loadEnv({ path: "server/.env", override: false });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const email = `ui-pass-${Date.now()}@kairos.dev`;
const password = "KairosUITest123!";
const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
  method: "POST",
  headers: {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email,
    password,
    email_confirm: true,
  }),
});

if (!response.ok) {
  throw new Error(await response.text());
}

const data = await response.json();
const user = data.user ?? data;
if (!user?.id)
  throw new Error(`User creation returned unexpected payload: ${JSON.stringify(data)}`);

console.log(JSON.stringify({ email, password, userId: user.id }));
