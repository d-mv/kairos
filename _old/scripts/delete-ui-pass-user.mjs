import { config as loadEnv } from "dotenv";

loadEnv();
loadEnv({ path: "server/.env", override: false });

const [userId] = process.argv.slice(2);

if (!userId) {
  throw new Error("Usage: node scripts/delete-ui-pass-user.mjs <userId>");
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
  method: "DELETE",
  headers: {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  },
});

if (!response.ok) {
  throw new Error(await response.text());
}

console.log(JSON.stringify({ deletedUserId: userId }));
