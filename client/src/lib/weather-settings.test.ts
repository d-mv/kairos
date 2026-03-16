import assert from "node:assert/strict";
import test from "node:test";
import {
  loadWeatherLocationSetting,
  saveWeatherLocationSetting,
  type WeatherLocationSetting,
} from "./weather-settings.js";

const storage = new Map<string, string>();

const localStorageMock = {
  getItem(key: string) {
    return storage.get(key) ?? null;
  },
  setItem(key: string, value: string) {
    storage.set(key, value);
  },
  removeItem(key: string) {
    storage.delete(key);
  },
};

test("loadWeatherLocationSetting returns null for invalid data", () => {
  storage.set("kairos:weather-location", '{"name":true}');
  assert.equal(loadWeatherLocationSetting(localStorageMock), null);
});

test("saveWeatherLocationSetting persists a complete location", () => {
  const location: WeatherLocationSetting = {
    name: "Lisbon, Portugal",
    latitude: 38.7167,
    longitude: -9.1333,
    timezone: "Europe/Lisbon",
  };

  saveWeatherLocationSetting(localStorageMock, location);

  assert.deepEqual(loadWeatherLocationSetting(localStorageMock), location);
});
