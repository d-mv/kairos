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
  headline: string;
  details: string[];
};

function roundPercent(value: number): number {
  return Math.round(value);
}

function getPercentChange(base: number, next: number): number {
  if (base === 0) return 0;
  return ((next - base) / Math.abs(base)) * 100;
}

function formatTemperature(value: number): string {
  return `${Math.round(value)}°C`;
}

function formatPressure(value: number): string {
  return `${Math.round(value)} hPa`;
}

export function getTodayWeatherSummary(
  weather: TodayWeatherInput,
  _today: string,
): TodayWeatherSummary | null {
  const current = weather.current;
  if (!current) return null;

  const headline = `${formatTemperature(current.temperature)} now · ${formatPressure(current.pressure)} now`;

  if (weather.hourly.length === 0) {
    return { headline, details: [] };
  }

  const temperatures = weather.hourly.map((point) => point.temperature);
  const pressures = weather.hourly.map((point) => point.pressure);

  const maxTemperatureRise = Math.max(
    0,
    ...temperatures.map((value) => getPercentChange(current.temperature, value)),
  );
  const maxTemperatureDrop = Math.max(
    0,
    ...temperatures.map((value) => getPercentChange(current.temperature, value) * -1),
  );
  const maxPressureRise = Math.max(
    0,
    ...pressures.map((value) => getPercentChange(current.pressure, value)),
  );
  const maxPressureDrop = Math.max(
    0,
    ...pressures.map((value) => getPercentChange(current.pressure, value) * -1),
  );

  const details: string[] = [];

  if (weather.hourly.some((point) => point.precipitation > 0)) {
    details.push("Rain is expected today.");
  }

  if (maxTemperatureRise > 15 || maxTemperatureDrop > 15) {
    details.push(
      `Temperature may rise up to ${roundPercent(maxTemperatureRise)}% and fall up to ${roundPercent(maxTemperatureDrop)}% today.`,
    );
  }

  if (maxPressureRise > 15 || maxPressureDrop > 15) {
    details.push(
      `Pressure may rise up to ${roundPercent(maxPressureRise)}% and fall up to ${roundPercent(maxPressureDrop)}% today.`,
    );
  }

  return { headline, details };
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
