import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Alert, Box, Flex, Paper, Stack, Text, Title } from "@mantine/core";
import { useComputedColorScheme } from "@mantine/core";
import { useMemo } from "react";
import { ThemeToggle } from "../components/ThemeToggle.js";
import { supabase } from "../lib/supabase.js";

function parseHashError(): string | null {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const desc = params.get("error_description");
  if (!desc) return null;
  return desc.replace(/\+/g, " ");
}

export default function LoginPage() {
  const computed = useComputedColorScheme("light");
  const hashError = useMemo(() => parseHashError(), []);

  return (
    <Flex h="100dvh" style={{ overflow: "hidden" }}>
      <Box
        flex={1}
        p="xl"
        style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}
        visibleFrom="md"
      >
        <Box maw={480} mx="auto" w="100%">
          <Flex justify="space-between" align="flex-start" mb="xl">
            <Box>
              <Text size="sm" c="dimmed" tt="uppercase" fw={600} mb={4}>
                Kairos
              </Text>
              <Title order={1} size="h2" maw={400}>
                Shape work with a calmer system.
              </Title>
            </Box>
            <ThemeToggle />
          </Flex>
          <Stack gap="sm">
            <Text size="sm" c="dimmed">
              Projects, areas, and task details stay in one focused workspace.
            </Text>
            <Text size="sm" c="dimmed">
              Light and dark themes keep the same structure, contrast, and hierarchy.
            </Text>
          </Stack>
        </Box>
      </Box>

      <Flex
        w={{ base: "100%", md: 480 }}
        style={{ flexShrink: 0 }}
        align="center"
        justify="center"
        p="xl"
      >
        <Paper w="100%" maw={400} p="xl" radius="md" withBorder>
          {hashError && (
            <Alert color="red" mb="md">
              {hashError}
            </Alert>
          )}
          <Box mb="xl">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
              Sign in
            </Text>
            <Title order={2} size="h3" mb={4}>
              Welcome back
            </Title>
            <Text size="sm" c="dimmed">
              Sign in to your workspace
            </Text>
          </Box>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            theme="default"
            dark={computed === "dark"}
            redirectTo={window.location.origin}
          />
        </Paper>
      </Flex>
    </Flex>
  );
}
