import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { ThemeToggle } from "../components/ThemeToggle.js";
import { useTheme } from "../components/ThemeProvider.js";
import { supabase } from "../lib/supabase.js";

export default function LoginPage() {
  const { theme } = useTheme();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
      <div className="panel relative z-10 w-full max-w-5xl overflow-hidden rounded-[2rem]">
        <div className="grid min-h-[42rem] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between bg-primary px-8 py-8 text-primary-foreground lg:px-10 lg:py-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.74rem] font-semibold uppercase tracking-[0.34em] text-primary-foreground/65">
                  Kairos
                </p>
                <h1 className="mt-3 max-w-md text-4xl font-semibold tracking-tight lg:text-5xl">
                  Shape work with a calmer system.
                </h1>
              </div>
              <ThemeToggle className="border-primary-foreground/15 bg-primary-foreground/8 text-primary-foreground hover:bg-primary-foreground/14 hover:text-primary-foreground" />
            </div>
            <div className="grid gap-4 text-sm text-primary-foreground/72">
              <div className="rounded-[1.4rem] border border-primary-foreground/10 bg-primary-foreground/6 p-5">
                Projects, areas, and task details stay in one focused workspace.
              </div>
              <div className="rounded-[1.4rem] border border-primary-foreground/10 bg-primary-foreground/6 p-5">
                Light and dark themes keep the same structure, contrast, and hierarchy.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center px-6 py-8 lg:px-10">
            <div className="w-full max-w-sm space-y-6">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                  Sign in
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">Welcome back</h2>
                <p className="mt-2 text-sm text-muted-foreground">Sign in to your workspace</p>
              </div>
              <div className="soft-panel rounded-[1.6rem] p-4">
                <Auth
                  supabaseClient={supabase}
                  appearance={{ theme: ThemeSupa }}
                  providers={[]}
                  theme="default"
                  dark={theme === "dark"}
                  redirectTo={window.location.origin}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
