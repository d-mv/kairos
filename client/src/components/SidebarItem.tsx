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
        "flex min-w-0 flex-1 items-center gap-2 rounded-[1 rem] px-2  text-base transition-colors group-hover:bg-accent group-hover:underline underline-offset-[0.3rem] decoration-[0.1rem]",
        isActive(path) ? "text-accent-foreground font-medium" : "text-muted-foreground",
        className,
      )}
    >
      <span className="truncate">{children}</span>
    </Link>
  );
}
