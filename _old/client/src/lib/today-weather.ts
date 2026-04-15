export type TodayWeatherPoint = {
  temperature: number;
  pressure: number;
  precipitation: number;
};

export type TodayWeatherInput = {
  current: Pick<TodayWeatherPoint, "temperature" | "pressure"> | null;
  hourly: TodayWeatherPoint[];
};

export type TodayWeatherSummary = {
  temperature: string;
  pressure: string;
  hasRain: boolean;
  tempAlert: string | null;
  pressureAlert: string | null;
};

function formatTemperature(value: number): string {
  return `${Math.round(value)}°C`;
}

function formatPressure(value: number): string {
  return `${Math.round(value)} hPa`;
}

export function getTodayWeatherSummary(weather: TodayWeatherInput): TodayWeatherSummary | null {
  const current = weather.current;
  if (!current) return null;

  const temperature = formatTemperature(current.temperature);
  const pressure = formatPressure(current.pressure);

  if (weather.hourly.length === 0) {
    return { temperature, pressure, hasRain: false, tempAlert: null, pressureAlert: null };
  }

  const temperatures = weather.hourly.map((point) => point.temperature);
  const pressures = weather.hourly.map((point) => point.pressure);

  const maxTempRise = Math.max(0, ...temperatures.map((t) => t - current.temperature));
  const maxTempDrop = Math.max(0, ...temperatures.map((t) => current.temperature - t));
  const maxPressureRise = Math.max(0, ...pressures.map((p) => p - current.pressure));
  const maxPressureDrop = Math.max(0, ...pressures.map((p) => current.pressure - p));

  const hasRain = weather.hourly.some((point) => point.precipitation > 0);

  const tempAlert =
    maxTempRise > 5 || maxTempDrop > 5
      ? `+${Math.round(maxTempRise)}°C / -${Math.round(maxTempDrop)}°C`
      : null;

  const pressureAlert =
    maxPressureRise > 5 || maxPressureDrop > 5
      ? `+${Math.round(maxPressureRise)} / -${Math.round(maxPressureDrop)} hPa`
      : null;

  return { temperature, pressure, hasRain, tempAlert, pressureAlert };
}

export type WeatherLocationOption = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

export async function searchWeatherLocations(query: string): Promise<WeatherLocationOption[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to search locations");

  const payload = (await response.json()) as {
    results?: Array<{
      id: number;
      name: string;
      country: string;
      admin1?: string;
      latitude: number;
      longitude: number;
      timezone: string;
    }>;
  };

  return (payload.results ?? []).map((result) => ({
    id: String(result.id),
    name: [result.name, result.admin1, result.country].filter(Boolean).join(", "),
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone,
  }));
}

export async function fetchTodayWeather(
  location: WeatherLocationOption | { latitude: number; longitude: number; timezone: string },
): Promise<TodayWeatherInput> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("timezone", location.timezone);
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("current", "temperature_2m,surface_pressure");
  url.searchParams.set("hourly", "temperature_2m,surface_pressure,precipitation");

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to load weather");

  const payload = (await response.json()) as {
    current?: { temperature_2m?: number; surface_pressure?: number };
    hourly?: {
      temperature_2m?: number[];
      surface_pressure?: number[];
      precipitation?: number[];
    };
  };

  const temperatures = payload.hourly?.temperature_2m ?? [];
  const pressures = payload.hourly?.surface_pressure ?? [];
  const precipitation = payload.hourly?.precipitation ?? [];
  const maxLength = Math.min(temperatures.length, pressures.length, precipitation.length);

  return {
    current:
      typeof payload.current?.temperature_2m === "number" &&
      typeof payload.current?.surface_pressure === "number"
        ? {
            temperature: payload.current.temperature_2m,
            pressure: payload.current.surface_pressure,
          }
        : null,
    hourly: Array.from({ length: maxLength }, (_, index) => ({
      temperature: temperatures[index] ?? 0,
      pressure: pressures[index] ?? 0,
      precipitation: precipitation[index] ?? 0,
    })),
  };
}
