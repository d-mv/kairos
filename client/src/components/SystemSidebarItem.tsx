import { SidebarItem } from "./SidebarItem";

type Props = {
  path: string;
  children: string;
};

export function SystemSidebarItem({ path, children }: Props) {
  return (
    <div className="flex">
      <span id={`indent-h-${path}`} className="h-6 w-2" />
      <SidebarItem path={path}>{children}</SidebarItem>
    </div>
  );
}
