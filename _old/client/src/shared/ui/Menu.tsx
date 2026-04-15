import { ActionIcon, Menu as MantineMenu, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import type { PageMenuItem } from "../../atoms/pageMenu.atom.js";
import { CheckIcon, EllipsisVerticalIcon } from "../../components/ui/heroicons.js";
import { findMenuShortcutItem } from "../../lib/menu-shortcuts.js";

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

  useEffect(() => {
    if (!opened || !topSection || topSection.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const shortcutItem = findMenuShortcutItem(topSection, event.key);
      if (!shortcutItem) return;
      event.preventDefault();
      shortcutItem.onClick();
      setOpened(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [opened, topSection]);

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
            {topSection.map((item, index) => {
              const previousSection = index > 0 ? topSection[index - 1]?.section : undefined;
              const showSectionLabel = item.section && item.section !== previousSection;

              return (
                <div key={`${item.section ?? "default"}:${item.label}`}>
                  {showSectionLabel ? (
                    <MantineMenu.Label
                      styles={{
                        label: {
                          color: "var(--mantine-color-text)",
                          fontWeight: 600,
                        },
                      }}
                    >
                      {item.section}
                    </MantineMenu.Label>
                  ) : null}
                  <MantineMenu.Item
                    color={item.color}
                    disabled={item.disabled}
                    onClick={item.onClick}
                    leftSection={item.selected ? <CheckIcon width={14} height={14} /> : undefined}
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
                </div>
              );
            })}
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
