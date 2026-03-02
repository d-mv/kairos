import { PropsWithChildren } from "react";

export function SectionLabel({ children }: PropsWithChildren) {
  return (
    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
      {children}
    </p>
  );
}
