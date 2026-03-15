import type { IntegrationProvider, IntegrationStatusDTO } from "@kairos/shared";
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { dialogsAtom } from "../atoms/dialogs.atom.js";
import { api } from "../lib/api.js";

type SettingsTab = "integrations";

function getStatus(
  statuses: IntegrationStatusDTO[],
  provider: IntegrationProvider,
): IntegrationStatusDTO | undefined {
  return statuses.find((status) => status.provider === provider);
}

export function SettingsDialog() {
  const [dialogs, setDialogs] = useAtom(dialogsAtom);
  const location = useLocation();
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<IntegrationStatusDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [todoistToken, setTodoistToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const search = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const queryDialog = search.get("dialog");
  const queryTab = (search.get("tab") as SettingsTab | null) ?? "integrations";
  const queryProvider = search.get("provider");
  const queryStatus = search.get("status");
  const queryError = search.get("error");
  const opened = dialogs.includes("settingsDialog") || queryDialog === "settings";

  const googleCalendar = getStatus(statuses, "google_calendar");
  const googleDrive = getStatus(statuses, "google_drive");
  const todoist = getStatus(statuses, "todoist");

  useEffect(() => {
    if (!opened) return;
    if (!dialogs.includes("settingsDialog")) {
      setDialogs((prev) => [...prev, "settingsDialog"]);
    }
  }, [dialogs, opened, setDialogs]);

  useEffect(() => {
    if (!opened) return;
    setLoading(true);
    setError(null);
    api.integrations
      .list()
      .then((nextStatuses) => setStatuses(nextStatuses))
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "Failed to load integrations");
      })
      .finally(() => setLoading(false));
  }, [opened]);

  const clearSettingsSearch = () => {
    if (queryDialog !== "settings") return;
    navigate(location.pathname, { replace: true });
  };

  const handleClose = () => {
    setDialogs((prev) => prev.filter((item) => item !== "settingsDialog"));
    clearSettingsSearch();
    setError(null);
    setTodoistToken("");
    setActiveProvider(null);
  };

  const refreshStatuses = async () => {
    setStatuses(await api.integrations.list());
  };

  const handleGoogleConnect = async () => {
    try {
      setActiveProvider("google");
      const { url } = await api.integrations.getGoogleAuthUrl();
      window.location.assign(url);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Failed to start Google connection",
      );
      setActiveProvider(null);
    }
  };

  const handleDisconnect = async (provider: "google" | "todoist") => {
    try {
      setActiveProvider(provider);
      setError(null);
      await api.integrations.disconnect(provider);
      await refreshStatuses();
      if (provider === "todoist") setTodoistToken("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to disconnect integration");
    } finally {
      setActiveProvider(null);
    }
  };

  const handleTodoistSave = async () => {
    try {
      setActiveProvider("todoist");
      setError(null);
      await api.integrations.saveTodoistToken(todoistToken);
      setTodoistToken("");
      await refreshStatuses();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to save Todoist token");
    } finally {
      setActiveProvider(null);
    }
  };

  const googleConnected = Boolean(googleCalendar?.connected && googleDrive?.connected);

  return (
    <Modal opened={opened} onClose={handleClose} title="Settings" size="lg">
      <Tabs defaultValue={queryTab}>
        <Tabs.List>
          <Tabs.Tab value="integrations">Integrations</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="integrations" pt="md">
          <Stack gap="md">
            {queryStatus ? (
              <Alert color={queryStatus === "success" ? "green" : "red"}>
                {queryStatus === "success"
                  ? `${queryProvider === "google" ? "Google" : "Integration"} connected`
                  : (queryError ?? "Integration failed")}
              </Alert>
            ) : null}

            {error ? <Alert color="red">{error}</Alert> : null}

            <Box>
              <Title order={4}>Google Calendar</Title>
              <Text c="dimmed" size="sm" mb="xs">
                Calendar and Drive share one Google connection and one approval flow.
              </Text>
              <Group justify="space-between">
                <Badge color={googleCalendar?.connected ? "green" : "gray"}>
                  {googleCalendar?.connected ? "Connected" : "Disconnected"}
                </Badge>
                {googleConnected ? (
                  <Button
                    variant="light"
                    onClick={() => void handleDisconnect("google")}
                    loading={activeProvider === "google"}
                  >
                    Disconnect Google
                  </Button>
                ) : (
                  <Button
                    onClick={() => void handleGoogleConnect()}
                    loading={activeProvider === "google"}
                  >
                    Connect Google
                  </Button>
                )}
              </Group>
            </Box>

            <Box>
              <Title order={4}>Google Drive</Title>
              <Text c="dimmed" size="sm" mb="xs">
                Full Drive access is enabled for future task attachments and linked files.
              </Text>
              <Group justify="space-between">
                <Badge color={googleDrive?.connected ? "green" : "gray"}>
                  {googleDrive?.connected ? "Connected" : "Disconnected"}
                </Badge>
                {googleConnected ? (
                  <Button
                    variant="light"
                    onClick={() => void handleDisconnect("google")}
                    loading={activeProvider === "google"}
                  >
                    Disconnect Google
                  </Button>
                ) : (
                  <Button
                    onClick={() => void handleGoogleConnect()}
                    loading={activeProvider === "google"}
                  >
                    Connect Google
                  </Button>
                )}
              </Group>
            </Box>

            <Box>
              <Title order={4}>Todoist</Title>
              <Text c="dimmed" size="sm" mb="xs">
                Provide your own Todoist API token. It is stored encrypted on the server.
              </Text>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Badge color={todoist?.connected ? "green" : "gray"}>
                    {todoist?.connected ? "Connected" : "Disconnected"}
                  </Badge>
                  {todoist?.connected ? (
                    <Button
                      variant="light"
                      onClick={() => void handleDisconnect("todoist")}
                      loading={activeProvider === "todoist"}
                    >
                      Disconnect
                    </Button>
                  ) : null}
                </Group>
                <PasswordInput
                  value={todoistToken}
                  onChange={(event) => setTodoistToken(event.currentTarget.value)}
                  placeholder="Paste Todoist API token"
                />
                <Button
                  onClick={() => void handleTodoistSave()}
                  disabled={!todoistToken.trim()}
                  loading={activeProvider === "todoist"}
                >
                  {todoist?.connected ? "Update Token" : "Save Token"}
                </Button>
              </Stack>
            </Box>

            {loading ? <Text c="dimmed">Loading integrations…</Text> : null}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
