import { config as loadEnv } from "dotenv";

loadEnv();
loadEnv({ path: "client/.env", override: false });

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  throw new Error("Usage: node scripts/seed-ui-pass-workspace.mjs <email> <password>");
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const apiBaseUrl = process.env.KAIROS_API_BASE_URL ?? "http://127.0.0.1:3000";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: {
    apikey: supabaseAnonKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email, password }),
});

if (!authResponse.ok) {
  throw new Error(await authResponse.text());
}

const authData = await authResponse.json();
const token = authData.access_token;

if (!token) {
  throw new Error("Sign-in returned no access token");
}

const api = async (path, method, body) => {
  const response = await fetch(`${apiBaseUrl}/api/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.status === 204 ? null : response.json();
};

const area = await api("/areas", "POST", { name: "Product" });
const project = await api("/projects", "POST", { name: "Design system", areaId: area.id });
const inboxTask = await api("/tasks", "POST", { title: "Capture launch feedback" });
const projectTask = await api("/tasks", "POST", {
  title: "Polish authenticated shell",
  projectId: project.id,
  priority: 2,
});

console.log(
  JSON.stringify({
    areaId: area.id,
    projectId: project.id,
    inboxTaskId: inboxTask.id,
    projectTaskId: projectTask.id,
  }),
);
