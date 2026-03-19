import type { ApiKeyDTO, IntegrationProvider, IntegrationStatusDTO } from "@kairos/shared";
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { dialogsAtom } from "../atoms/dialogs.atom.js";
import { api } from "../lib/api.js";
import {
  loadWeatherLocationSetting,
  saveWeatherLocationSetting,
  type WeatherLocationSetting,
} from "../lib/weather-settings.js";
import { searchWeatherLocations, type WeatherLocationOption } from "../lib/today-weather.js";

type SettingsTab = "general" | "integrations" | "api";

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
  const [weatherQuery, setWeatherQuery] = useState("");
  const [weatherLocation, setWeatherLocation] = useState<WeatherLocationSetting | null>(null);
  const [weatherSuggestions, setWeatherSuggestions] = useState<WeatherLocationOption[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createNotice, setCreateNotice] = useState<string | null>(null);

  const [apiTokens, setApiTokens] = useState<ApiKeyDTO[]>([]);
  const [apiTokensLoading, setApiTokensLoading] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [creatingToken, setCreatingToken] = useState(false);
  const [deletingTokenId, setDeletingTokenId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

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
    const saved = loadWeatherLocationSetting();
    setWeatherLocation(saved);
    setWeatherQuery(saved?.name ?? "");
    setWeatherSuggestions([]);
  }, [opened]);

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

  useEffect(() => {
    if (!opened) return;
    const trimmed = weatherQuery.trim();
    if (trimmed.length < 2) {
      setWeatherSuggestions([]);
      setWeatherLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setWeatherLoading(true);
      searchWeatherLocations(trimmed)
        .then((results) => setWeatherSuggestions(results))
        .catch(() => setWeatherSuggestions([]))
        .finally(() => setWeatherLoading(false));
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [opened, weatherQuery]);

  const clearSettingsSearch = () => {
    if (queryDialog !== "settings") return;
    navigate(location.pathname, { replace: true });
  };

  useEffect(() => {
    if (!opened) return;
    setApiTokensLoading(true);
    setApiError(null);
    api.auth
      .listApiKeys()
      .then(setApiTokens)
      .catch((err) => setApiError(err instanceof Error ? err.message : "Failed to load API tokens"))
      .finally(() => setApiTokensLoading(false));
  }, [opened]);

  const handleClose = () => {
    setDialogs((prev) => prev.filter((item) => item !== "settingsDialog"));
    clearSettingsSearch();
    setError(null);
    setTodoistToken("");
    setActiveProvider(null);
    setWeatherSuggestions([]);
    setWeatherLoading(false);
    setCreateNotice(null);
    setNewTokenName("");
    setApiError(null);
  };

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) return;
    try {
      setCreatingToken(true);
      setApiError(null);
      setCreateNotice(null);
      const created = await api.auth.createApiKey(newTokenName.trim());
      setNewTokenName("");
      let copied = false;
      if (typeof navigator?.clipboard?.writeText === "function") {
        try {
          await navigator.clipboard.writeText(created.apiKey);
          copied = true;
        } catch {
          copied = false;
        }
      }
      if (copied) {
        setCreateNotice("Token created and copied to clipboard.");
      } else {
        setCreateNotice("Token created. Copy failed in this browser; please try again.");
      }
      setApiTokens((prev) => [
        ...prev,
        {
          id: created.id,
          name: created.name,
          keyPreview: created.keyPreview,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
      ]);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to create API token");
    } finally {
      setCreatingToken(false);
    }
  };

  const handleDeleteToken = async (id: string) => {
    try {
      setDeletingTokenId(id);
      setApiError(null);
      await api.auth.deleteApiKey(id);
      setApiTokens((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to delete API token");
    } finally {
      setDeletingTokenId(null);
    }
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

  const handleWeatherPick = (option: WeatherLocationOption) => {
    const nextLocation = {
      id: option.id,
      name: option.name,
      latitude: option.latitude,
      longitude: option.longitude,
      timezone: option.timezone,
    };
    setWeatherLocation(nextLocation);
    setWeatherQuery(option.name);
    setWeatherSuggestions([]);
  };

  const handleWeatherSave = () => {
    saveWeatherLocationSetting(localStorage, weatherLocation);
    window.dispatchEvent(new CustomEvent("kairos:weather-location-changed"));
  };

  const handleWeatherClear = () => {
    setWeatherLocation(null);
    setWeatherQuery("");
    setWeatherSuggestions([]);
    saveWeatherLocationSetting(localStorage, null);
    window.dispatchEvent(new CustomEvent("kairos:weather-location-changed"));
  };

  const googleConnected = Boolean(googleCalendar?.connected && googleDrive?.connected);

  return (
    <Modal opened={opened} onClose={handleClose} title="Settings" size="lg">
      <Tabs defaultValue={queryTab}>
        <Tabs.List>
          <Tabs.Tab value="general">General</Tabs.Tab>
          <Tabs.Tab value="integrations">Integrations</Tabs.Tab>
          <Tabs.Tab value="api">API</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general" pt="md">
          <Stack gap="md">
            <Box>
              <Title order={4}>Weather location</Title>
              <Text c="dimmed" size="sm" mb="xs">
                Used by Today to show current conditions and notable weather deviations.
              </Text>
              <Stack gap="sm">
                <TextInput
                  value={weatherQuery}
                  onChange={(event) => {
                    setWeatherQuery(event.currentTarget.value);
                    if (weatherLocation?.name !== event.currentTarget.value) {
                      setWeatherLocation(null);
                    }
                  }}
                  placeholder="City, country"
                />
                {weatherSuggestions.length > 0 ? (
                  <Stack gap={4}>
                    {weatherSuggestions.map((option) => (
                      <Button
                        key={option.id}
                        variant="subtle"
                        justify="flex-start"
                        onClick={() => handleWeatherPick(option)}
                      >
                        {option.name}
                      </Button>
                    ))}
                  </Stack>
                ) : null}
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {weatherLocation ? `Saved: ${weatherLocation.name}` : "No location saved"}
                  </Text>
                  <Group gap="xs">
                    <Button variant="light" onClick={handleWeatherClear}>
                      Clear
                    </Button>
                    <Button onClick={handleWeatherSave} disabled={!weatherLocation}>
                      Save location
                    </Button>
                  </Group>
                </Group>
                {weatherLoading ? <Text c="dimmed">Searching locations…</Text> : null}
              </Stack>
            </Box>
          </Stack>
        </Tabs.Panel>

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

        <Tabs.Panel value="api" pt="md">
          <Stack gap="md">
            <Box>
              <Title order={4}>API Tokens</Title>
              <Text c="dimmed" size="sm" mb="xs">
                Use API tokens to access Kairos programmatically.
              </Text>
            </Box>

            {apiError ? <Alert color="red">{apiError}</Alert> : null}

            {createNotice ? (
              <Alert color="green" title="Token created">
                {createNotice}
              </Alert>
            ) : null}

            {apiTokensLoading ? (
              <Text c="dimmed">Loading tokens…</Text>
            ) : apiTokens.length > 0 ? (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Created</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {apiTokens.map((token) => (
                    <Table.Tr key={token.id}>
                      <Table.Td>{token.name}</Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {new Date(token.createdAt).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          variant="subtle"
                          color="red"
                          size="xs"
                          loading={deletingTokenId === token.id}
                          onClick={() => void handleDeleteToken(token.id)}
                        >
                          Revoke
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed" size="sm">
                No API tokens yet.
              </Text>
            )}

            <Box>
              <Text fw={500} mb="xs">
                Create new token
              </Text>
              <Group gap="sm">
                <TextInput
                  placeholder="Token name"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleCreateToken();
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  onClick={() => void handleCreateToken()}
                  loading={creatingToken}
                  disabled={!newTokenName.trim()}
                >
                  Create
                </Button>
              </Group>
            </Box>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
