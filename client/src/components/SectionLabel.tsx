import { PropsWithChildren } from "react";

export function SectionLabel({ children }: PropsWithChildren) {
  return <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{children}</p>;
}
