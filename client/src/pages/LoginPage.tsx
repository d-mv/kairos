import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../lib/supabase.js";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center">Kairos</h1>
        <p className="text-muted-foreground text-center">Sign in to your workspace</p>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          theme="light"
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  );
}
