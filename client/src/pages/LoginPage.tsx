import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { ThemeToggle } from "../components/ThemeToggle.js";
import { useTheme } from "../components/ThemeProvider.js";
import { supabase } from "../lib/supabase.js";

export default function LoginPage() {
  const { theme } = useTheme();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-[2.4rem] py-[4rem] lg:px-[3.2rem] lg:py-[4.8rem]">
      <div className="panel relative z-10 w-full max-w-[120rem] overflow-hidden rounded-[2.4rem]">
        <div className="grid min-h-[54rem] lg:grid-cols-[1.12fr_0.88fr]">
          <div className="flex flex-col justify-between bg-primary px-[3.2rem] py-[3.2rem] text-primary-foreground lg:px-[4.8rem] lg:py-[4.8rem]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.74rem] font-semibold uppercase tracking-[0.34em] text-primary-foreground/65">
                  Kairos
                </p>
                <h1 className="mt-3 max-w-[40rem] text-4xl font-semibold tracking-tight lg:text-[5.6rem] lg:leading-[1]">
                  Shape work with a calmer system.
                </h1>
              </div>
              <ThemeToggle className="h-[4rem] w-[4rem] rounded-full border-primary-foreground/15 bg-primary-foreground/8 text-primary-foreground hover:bg-primary-foreground/14 hover:text-primary-foreground" />
            </div>
            <div className="grid gap-4 text-sm text-primary-foreground/72 lg:max-w-[42rem]">
              <div className="rounded-[1.4rem] border border-primary-foreground/10 bg-primary-foreground/6 p-6">
                Projects, areas, and task details stay in one focused workspace.
              </div>
              <div className="rounded-[1.4rem] border border-primary-foreground/10 bg-primary-foreground/6 p-6">
                Light and dark themes keep the same structure, contrast, and hierarchy.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center px-[2.4rem] py-[3.2rem] lg:px-[4.8rem]">
            <div className="w-full max-w-[38rem] space-y-6">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                  Sign in
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">Welcome back</h2>
                <p className="mt-2 text-sm text-muted-foreground">Sign in to your workspace</p>
              </div>
              <div className="soft-panel rounded-[1.8rem] p-5">
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
