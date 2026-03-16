export type WeatherLocationSetting = {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

const WEATHER_LOCATION_STORAGE_KEY = "kairos:weather-location";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isWeatherLocationSetting(value: unknown): value is WeatherLocationSetting {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate["name"] === "string" &&
    typeof candidate["latitude"] === "number" &&
    Number.isFinite(candidate["latitude"]) &&
    typeof candidate["longitude"] === "number" &&
    Number.isFinite(candidate["longitude"]) &&
    typeof candidate["timezone"] === "string"
  );
}

export function loadWeatherLocationSetting(
  storage: StorageLike = localStorage,
): WeatherLocationSetting | null {
  try {
    const raw = storage.getItem(WEATHER_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isWeatherLocationSetting(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveWeatherLocationSetting(
  storage: StorageLike = localStorage,
  location: WeatherLocationSetting | null,
): void {
  if (!location) {
    storage.removeItem(WEATHER_LOCATION_STORAGE_KEY);
    return;
  }
  storage.setItem(WEATHER_LOCATION_STORAGE_KEY, JSON.stringify(location));
}
