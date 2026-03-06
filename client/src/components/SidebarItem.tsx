import { Link } from "react-router-dom";
import { useIsActive } from "../lib/useIsActive";
import { cn } from "../lib/utils";

type Props = { className?: string; path: string; children: string };

export function SidebarItem({ path, className, children }: Props) {
  const isActive = useIsActive();
  return (
    <Link
      to={path}
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-[1.5rem] transition-colors",
        isActive(path)
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
        className,
      )}
    >
      <span className="truncate">{children}</span>
    </Link>
  );
}
