import { ActionIcon, Menu as MantineMenu, Text } from "@mantine/core";
import { useState } from "react";
import type { PageMenuItem } from "../../atoms/pageMenu.atom.js";
import { EllipsisVerticalIcon } from "../../components/ui/heroicons.js";

export type MenuItem = {
  label: string;
  shortcut?: string;
  color?: string;
  disabled?: boolean;
  onClick: () => void;
};

type Props = {
  items: MenuItem[];
  topSection?: PageMenuItem[];
};

export function Menu({ items, topSection }: Props) {
  const [opened, setOpened] = useState(false);

  return (
    <MantineMenu opened={opened} onChange={setOpened} withinPortal>
      <MantineMenu.Target>
        <ActionIcon variant="subtle" size="md" aria-label="Open workspace menu">
          <EllipsisVerticalIcon />
        </ActionIcon>
      </MantineMenu.Target>
      <MantineMenu.Dropdown>
        {topSection && topSection.length > 0 && (
          <>
            {topSection.map((item) => (
              <MantineMenu.Item
                key={item.label}
                color={item.color}
                disabled={item.disabled}
                onClick={item.onClick}
              >
                {item.label}
              </MantineMenu.Item>
            ))}
            <MantineMenu.Divider />
          </>
        )}
        {items.map((item) => (
          <MantineMenu.Item
            key={item.label}
            color={item.color}
            disabled={item.disabled}
            onClick={item.onClick}
            rightSection={
              item.shortcut ? (
                <Text size="xs" c="dimmed" style={{ letterSpacing: "0.05em" }}>
                  {item.shortcut}
                </Text>
              ) : undefined
            }
          >
            {item.label}
          </MantineMenu.Item>
        ))}
      </MantineMenu.Dropdown>
    </MantineMenu>
  );
}
