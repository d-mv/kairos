import { ApiKeyStatusDTO } from "@kairos/shared";
import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../ThemeProvider";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { EllipsisVerticalIcon, KeyIcon } from "../ui/heroicons";
// import { supabase } from "@supabase/auth-ui-shared";

export function Menu() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatusDTO | null>(null);
  const [apiKeyBusy, setApiKeyBusy] = useState(false);
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    let cancelled = false;

    api.auth
      .getApiKey()
      .then((status) => {
        if (!cancelled) setApiKeyStatus(status);
      })
      .catch(() => {
        if (!cancelled) setApiKeyStatus(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRotateApiKey = async () => {
    setApiKeyBusy(true);
    try {
      const rotated = await api.auth.rotateApiKey();
      setGeneratedApiKey(rotated.apiKey);
      setApiKeyStatus({
        hasKey: true,
        keyPreview: rotated.keyPreview,
        createdAt: rotated.createdAt,
        updatedAt: rotated.updatedAt,
      });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to generate API key");
    } finally {
      setApiKeyBusy(false);
    }
  };

  const handleCopyApiKey = async () => {
    if (!generatedApiKey) return;

    try {
      await navigator.clipboard.writeText(generatedApiKey);
    } catch {
      window.alert("Failed to copy API key");
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 absolute right-0 top-2">
        <div className="relative shrink-0" ref={menuRef}>
          <Button
            type="button"
            variant={menuOpen ? "outline" : "ghost"}
            size="icon"
            className="shrink-0"
            aria-label="Open workspace menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <EllipsisVerticalIcon className="h-5 w-5" />
          </Button>
          {menuOpen ? (
            <div className="absolute right-0 top-[calc(100%+0.8rem)] z-20 w-[18rem] rounded-[1.2rem] border border-[var(--color-sidebar-border)] bg-background/95 p-2 text-foreground shadow-[var(--shadow-panel)] backdrop-blur-xl z-10">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-[1rem] px-3 py-3 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  setMenuOpen(false);
                  toggleTheme();
                }}
              >
                Switch to {theme === "dark" ? "light" : "dark"}
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-[1rem] px-3 py-3 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  setMenuOpen(false);
                  setApiKeyDialogOpen(true);
                }}
              >
                MCP API key...
              </button>
              <button
                className="flex w-full items-center gap-3 rounded-[1rem] px-3 py-3 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => supabase.auth.signOut()}
                type="button"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <Dialog
        open={apiKeyDialogOpen}
        onOpenChange={(open) => {
          setApiKeyDialogOpen(open);
          if (!open) {
            setGeneratedApiKey(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>MCP API key</DialogTitle>
            <DialogDescription>
              Use this key for remote MCP access. The current key is never shown again after it is
              set.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-4 py-4">
            <div className="rounded-[1.2rem] border border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-accent)]/40 p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Current key
              </p>
              <p className="mt-2 text-sm font-semibold">
                {apiKeyStatus?.hasKey ? "set" : "not set"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {apiKeyStatus?.hasKey
                  ? "Generating a new key invalidates the existing one immediately."
                  : "Generate a key for remote MCP access."}
              </p>
            </div>
            {generatedApiKey ? (
              <div className="rounded-[1.2rem] border border-[var(--color-sidebar-border)] bg-background/70 p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  New key
                </p>
                <code className="mt-2 block break-all text-xs">{generatedApiKey}</code>
                <p className="mt-2 text-xs text-muted-foreground">
                  Copy it now. You will not be shown the full key again.
                </p>
              </div>
            ) : null}
          </div>
          <DialogFooter className="flex gap-3">
            {generatedApiKey ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  void handleCopyApiKey();
                }}
              >
                Copy API key
              </Button>
            ) : null}
            <Button
              type="button"
              className="w-full"
              disabled={apiKeyBusy}
              onClick={() => {
                void handleRotateApiKey();
              }}
            >
              <KeyIcon className="h-5 w-5" />
              {apiKeyBusy
                ? "Generating..."
                : apiKeyStatus?.hasKey
                  ? "Regenerate API key"
                  : "Generate API key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
