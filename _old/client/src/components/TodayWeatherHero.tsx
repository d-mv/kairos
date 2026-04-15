import { Group, Text } from "@mantine/core";
import {
  IoAlertCircleOutline,
  IoRainyOutline,
  IoSpeedometerOutline,
  IoSwapVerticalOutline,
  IoThermometerOutline,
} from "react-icons/io5";
import type { TodayWeatherSummary } from "../lib/today-weather.js";

type TodayWeatherHeroProps = {
  summary: TodayWeatherSummary | null;
  error: boolean;
};

export function TodayWeatherHero({ summary, error }: TodayWeatherHeroProps) {
  if (error) {
    return (
      <Group gap={4} mb="sm" align="center">
        <IoAlertCircleOutline size={14} />
        <Text size="sm" c="dimmed">
          Weather unavailable
        </Text>
      </Group>
    );
  }

  if (!summary) return null;

  return (
    <Group gap="md" mb="sm" align="center">
      <Group gap={4} align="center">
        <IoThermometerOutline size={14} />
        <Text size="sm">{summary.temperature}</Text>
      </Group>
      <Group gap={4} align="center">
        <IoSpeedometerOutline size={14} />
        <Text size="sm">{summary.pressure}</Text>
      </Group>
      {summary.hasRain && (
        <Group gap={4} align="center">
          <IoRainyOutline size={14} />
          <Text size="sm">Rain</Text>
        </Group>
      )}
      {summary.tempAlert && (
        <Group gap={4} align="center">
          <IoSwapVerticalOutline size={14} />
          <Text size="sm">{summary.tempAlert}</Text>
        </Group>
      )}
      {summary.pressureAlert && (
        <Group gap={4} align="center">
          <IoSwapVerticalOutline size={14} />
          <Text size="sm">{summary.pressureAlert}</Text>
        </Group>
      )}
    </Group>
  );
}
