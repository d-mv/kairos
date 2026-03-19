import assert from "node:assert/strict";
import test from "node:test";
import { getTodayWeatherSummary } from "./today-weather.js";

test("getTodayWeatherSummary reports rain and significant temperature and pressure changes", () => {
  const summary = getTodayWeatherSummary({
    current: { temperature: 20, pressure: 1000 },
    hourly: [
      { temperature: 20, pressure: 1000, precipitation: 0 },
      { temperature: 28, pressure: 1018, precipitation: 0.8 },
      { temperature: 14, pressure: 982, precipitation: 0 },
    ],
  });

  assert.equal(summary?.temperature, "20°C");
  assert.equal(summary?.pressure, "1000 hPa");
  assert.equal(summary?.hasRain, true);
  assert.equal(summary?.tempAlert, "+8°C / -6°C");
  assert.equal(summary?.pressureAlert, "+18 / -18 hPa");
});

test("getTodayWeatherSummary returns no alerts when changes stay below 5°C / 5 hPa", () => {
  const summary = getTodayWeatherSummary({
    current: { temperature: 20, pressure: 1000 },
    hourly: [
      { temperature: 23, pressure: 1004, precipitation: 0 },
      { temperature: 17, pressure: 996, precipitation: 0 },
    ],
  });

  assert.equal(summary?.temperature, "20°C");
  assert.equal(summary?.pressure, "1000 hPa");
  assert.equal(summary?.hasRain, false);
  assert.equal(summary?.tempAlert, null);
  assert.equal(summary?.pressureAlert, null);
});

test("getTodayWeatherSummary returns null without current conditions", () => {
  assert.equal(
    getTodayWeatherSummary({
      current: null,
      hourly: [],
    }),
    null,
  );
});
