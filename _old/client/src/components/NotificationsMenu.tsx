import { ActionIcon, Box, Button, Group, Indicator, Popover, Stack, Text } from "@mantine/core";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { notificationsAtom } from "../atoms/notifications.js";
import { workspaceReloadAtom } from "../atoms/workspace.js";
import { api } from "../lib/api.js";
import { BellIcon } from "./ui/heroicons.js";

export function NotificationsMenu() {
  const notifications = useAtomValue(notificationsAtom);
  const reloadWorkspace = useSetAtom(workspaceReloadAtom);
  const [opened, setOpened] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleRespond = async (id: string, action: "accept" | "decline") => {
    try {
      setBusyId(id);
      if (action === "accept") {
        await api.notifications.accept(id);
      } else {
        await api.notifications.decline(id);
      }
      reloadWorkspace((tick) => tick + 1);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Popover opened={opened} onChange={setOpened} position="bottom-end" withinPortal>
      <Popover.Target>
        <Indicator inline disabled={notifications.length === 0} size={7} color="red">
          <ActionIcon
            variant="subtle"
            size="md"
            aria-label="Open notifications"
            onClick={() => setOpened((value) => !value)}
          >
            <BellIcon width={18} height={18} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>
      <Popover.Dropdown p="sm" w={320}>
        <Stack gap="sm">
          <Text fw={600}>Notifications</Text>
          {notifications.length === 0 ? (
            <Text c="dimmed" size="sm">
              No pending notifications.
            </Text>
          ) : (
            notifications.map((notification) => (
              <Box
                key={notification.id}
                p="sm"
                style={{
                  border: "1px solid var(--mantine-color-default-border)",
                  borderRadius: 8,
                }}
              >
                <Stack gap={6}>
                  <Text size="sm">
                    <Text component="span" fw={600} inherit>
                      {notification.senderEmail}
                    </Text>{" "}
                    shared {notification.entityLabel} with you.
                  </Text>
                  <Text size="xs" c="dimmed">
                    Expires {new Date(notification.expiresAt).toLocaleString()}
                  </Text>
                  <Group gap="xs" justify="flex-end">
                    <Button
                      variant="light"
                      size="xs"
                      onClick={() => void handleRespond(notification.id, "decline")}
                      loading={busyId === notification.id}
                    >
                      Decline
                    </Button>
                    <Button
                      size="xs"
                      onClick={() => void handleRespond(notification.id, "accept")}
                      loading={busyId === notification.id}
                    >
                      Accept
                    </Button>
                  </Group>
                </Stack>
              </Box>
            ))
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
