import assert from "node:assert/strict";
import test from "node:test";
import { getTodayWeatherSummary } from "./today-weather.js";

test("getTodayWeatherSummary reports rain and significant temperature and pressure changes", () => {
  const summary = getTodayWeatherSummary(
    {
      current: { temperature: 20, pressure: 1000 },
      hourly: [
        { temperature: 20, pressure: 1000, precipitation: 0 },
        { temperature: 24, pressure: 1180, precipitation: 0.8 },
        { temperature: 16, pressure: 820, precipitation: 0 },
      ],
    },
    "2026-03-16",
  );

  assert.equal(summary?.headline, "20°C now · 1000 hPa now");
  assert.deepEqual(summary?.details, [
    "Rain is expected today.",
    "Temperature may rise up to 20% and fall up to 20% today.",
    "Pressure may rise up to 18% and fall up to 18% today.",
  ]);
});

test("getTodayWeatherSummary returns only the current conditions when changes stay below threshold", () => {
  const summary = getTodayWeatherSummary(
    {
      current: { temperature: 20, pressure: 1000 },
      hourly: [
        { temperature: 21, pressure: 1010, precipitation: 0 },
        { temperature: 19, pressure: 990, precipitation: 0 },
      ],
    },
    "2026-03-16",
  );

  assert.equal(summary?.headline, "20°C now · 1000 hPa now");
  assert.deepEqual(summary?.details, []);
});

test("getTodayWeatherSummary returns null without current conditions", () => {
  assert.equal(
    getTodayWeatherSummary(
      {
        current: null,
        hourly: [],
      },
      "2026-03-16",
    ),
    null,
  );
});
