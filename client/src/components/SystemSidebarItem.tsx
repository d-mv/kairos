import { SidebarItem } from "./SidebarItem";

type Props = {
  path: string;
  children: string;
};

export function SystemSidebarItem({ path, children }: Props) {
  return (
    <div className="flex group">
      <span id={`indent-h-${path}`} className="h-6 w-4 border-gray-300 border-b-[0.1rem]" />
      <SidebarItem path={path}>{children}</SidebarItem>
    </div>
  );
}
