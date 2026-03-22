import checkIsMobile from "is-mobile";
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { areasAtom } from "../atoms/areas.js";
import { brainPagesAtom } from "../atoms/brain.js";
import { projectsAtom } from "../atoms/projects.js";
import { selectedTaskIdAtom, tasksAtom } from "../atoms/tasks.js";
import { workspaceLoadingAtom } from "../atoms/workspace.js";
import { usePageTasks } from "../hooks/usePageTasks.js";
import {
  addSavedSearch,
  loadSavedSearches,
  removeSavedSearch,
  saveSavedSearches,
} from "../lib/saved-searches.js";
import { searchWorkspace } from "../lib/search.js";
import { TrashIcon } from "../components/ui/icons.js";

export default function SearchPage() {
  const tasks = useAtomValue(tasksAtom);
  const projects = useAtomValue(projectsAtom);
  const areas = useAtomValue(areasAtom);
  const brainPages = useAtomValue(brainPagesAtom);
  const isWorkspaceLoading = useAtomValue(workspaceLoadingAtom);
  const setSelectedTaskId = useSetAtom(selectedTaskIdAtom);
  const navigate = useNavigate();
  const isMobile = checkIsMobile();
  const isPageLoading = usePageTasks({ kind: "search" });
  const isLoading = isWorkspaceLoading || isPageLoading;
  const [query, setQuery] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);

  useEffect(() => {
    setSavedSearches(loadSavedSearches());
  }, []);

  useEffect(() => {
    saveSavedSearches(savedSearches);
  }, [savedSearches]);

  const results = useMemo(
    () => searchWorkspace(query, { tasks, projects, areas, brainPages }, { showCompleted }),
    [areas, brainPages, projects, query, showCompleted, tasks],
  );

  return (
    <Box flex={1} style={{ overflowY: "auto" }} p={isMobile ? "md" : "xl"}>
      <Box>
        <Box mb="xl">
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Workspace
          </Text>
          <Title order={2}>Query</Title>
        </Box>

        <Stack gap="md">
          <Group align="end" wrap="nowrap">
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search tasks, projects, areas, and brain pages"
              autoFocus
              style={{ flex: 1 }}
            />
            <Button onClick={() => setSavedSearches((prev) => addSavedSearch(prev, query))}>
              Save search
            </Button>
          </Group>

          <Checkbox
            label="Show completed"
            checked={showCompleted}
            onChange={(event) => setShowCompleted(event.currentTarget.checked)}
          />

          {savedSearches.length > 0 ? (
            <Stack gap="xs">
              <Text size="sm" c="dimmed" fw={500}>
                Saved searches
              </Text>
              {savedSearches.map((savedSearch) => (
                <Group key={savedSearch} gap="xs" wrap="nowrap">
                  <Button
                    variant="light"
                    onClick={() => setQuery(savedSearch)}
                    style={{ flex: 1, justifyContent: "flex-start" }}
                  >
                    {savedSearch}
                  </Button>
                  <ActionIcon
                    variant="subtle"
                    aria-label={`Remove saved search ${savedSearch}`}
                    onClick={() => setSavedSearches((prev) => removeSavedSearch(prev, savedSearch))}
                  >
                    <TrashIcon />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          ) : null}

          {!query.trim() ? (
            <Text c="dimmed">Type to query across your workspace.</Text>
          ) : isLoading ? (
            <Text c="dimmed">Loading tasks…</Text>
          ) : results.length === 0 ? (
            <Text c="dimmed">No results for “{query.trim()}”.</Text>
          ) : (
            <Stack gap="xs">
              {results.map((result) => (
                <Button
                  key={`${result.kind}:${result.id}`}
                  variant="subtle"
                  justify="space-between"
                  px={0}
                  onClick={() => {
                    setSelectedTaskId(result.kind === "task" ? result.id : null);
                    navigate(result.route);
                  }}
                  fullWidth
                >
                  <Group justify="space-between" w="100%" wrap="nowrap">
                    <Text truncate>{result.label}</Text>
                    <Text size="sm" c="dimmed">
                      {result.subtitle}
                    </Text>
                  </Group>
                </Button>
              ))}
            </Stack>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
