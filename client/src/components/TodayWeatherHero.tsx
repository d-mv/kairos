import { Box, Skeleton, Stack, Text } from "@mantine/core";
import type { TodayWeatherSummary } from "../lib/today-weather.js";

type TodayWeatherHeroProps = {
  locationName: string | null;
  summary: TodayWeatherSummary | null;
  loading: boolean;
};

export function TodayWeatherHero({ locationName, summary, loading }: TodayWeatherHeroProps) {
  if (loading) {
    return (
      <Box
        mb="lg"
        p="md"
        style={{
          borderRadius: 12,
          border: "1px solid var(--mantine-color-default-border)",
          background: "rgba(255, 255, 255, 0.38)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Stack gap="xs">
          <Skeleton h={14} radius="xl" />
          <Skeleton h={12} radius="xl" w="80%" />
          <Skeleton h={12} radius="xl" w="65%" />
        </Stack>
      </Box>
    );
  }

  if (!locationName || !summary) return null;

  return (
    <Box
      mb="lg"
      p="md"
      style={{
        borderRadius: 12,
        border: "1px solid rgba(255, 255, 255, 0.35)",
        background: "rgba(255, 255, 255, 0.2)",
        backdropFilter: "blur(12px)",
      }}
    >
      <Text size="sm" c="dimmed" mb={4}>
        {locationName}
      </Text>
      <Text size="lg" fw={600} mb={summary.details.length > 0 ? 8 : 0}>
        {summary.headline}
      </Text>
      {summary.details.map((detail) => (
        <Text key={detail} size="sm">
          {detail}
        </Text>
      ))}
    </Box>
  );
}
