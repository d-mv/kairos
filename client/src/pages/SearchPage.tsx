import checkIsMobile from "is-mobile";
import { Box, Button, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { useAtomValue, useSetAtom } from "jotai";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { areasAtom } from "../atoms/areas.js";
import { brainPagesAtom } from "../atoms/brain.js";
import { projectsAtom } from "../atoms/projects.js";
import { selectedTaskIdAtom, tasksAtom } from "../atoms/tasks.js";
import { searchWorkspace } from "../lib/search.js";

export default function SearchPage() {
  const tasks = useAtomValue(tasksAtom);
  const projects = useAtomValue(projectsAtom);
  const areas = useAtomValue(areasAtom);
  const brainPages = useAtomValue(brainPagesAtom);
  const setSelectedTaskId = useSetAtom(selectedTaskIdAtom);
  const navigate = useNavigate();
  const isMobile = checkIsMobile();
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => searchWorkspace(query, { tasks, projects, areas, brainPages }),
    [areas, brainPages, projects, query, tasks],
  );

  return (
    <Box flex={1} style={{ overflowY: "auto" }} p={isMobile ? "md" : "xl"}>
      <Box maw={760}>
        <Box mb="xl">
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            Workspace
          </Text>
          <Title order={2}>Search</Title>
        </Box>

        <Stack gap="md">
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search tasks, projects, areas, and brain pages"
            autoFocus
          />

          {!query.trim() ? (
            <Text c="dimmed">Type to search across your loaded workspace.</Text>
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
