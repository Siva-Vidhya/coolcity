import { withCachedPromise } from "@/services/cache";

export type CityKey = "bengaluru" | "hyderabad" | "chennai" | "delhi";

export const CITY_COORDINATES: Record<CityKey, { label: string; lat: number; lon: number }> = {
  bengaluru: { label: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  hyderabad: { label: "Hyderabad", lat: 17.385, lon: 78.4867 },
  chennai: { label: "Chennai", lat: 13.0827, lon: 80.2707 },
  delhi: { label: "Delhi", lat: 28.6139, lon: 77.209 }
};

export type LiveWeather = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  condition: string;
  iconCode?: string;
  source: string;
};

function fallbackWeather(city: CityKey): LiveWeather {
  const seed = Object.keys(CITY_COORDINATES).indexOf(city) + 1;
  return {
    temperature: Number((31 + seed * 1.4 + Math.sin(Date.now() / 280000) * 1.1).toFixed(1)),
    humidity: Math.round(52 + seed * 3),
    windSpeed: Number((6.4 - seed * 0.35).toFixed(1)),
    feelsLike: Number((34 + seed * 1.1).toFixed(1)),
    condition: "Fallback climate model",
    source: "Simulation fallback"
  };
}

function heatIndexCelsius(temperature: number, humidity: number) {
  return Number((temperature + 0.33 * humidity / 10 - 0.7 * 4 - 4).toFixed(1));
}

function weatherCodeToCondition(weatherCode: number) {
  if ([0].includes(weatherCode)) return "Clear";
  if ([1, 2, 3].includes(weatherCode)) return "Partly Cloudy";
  if ([45, 48].includes(weatherCode)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(weatherCode)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(weatherCode)) return "Rain";
  if ([71, 73, 75, 77].includes(weatherCode)) return "Snow";
  if ([80, 81, 82].includes(weatherCode)) return "Showers";
  if ([95, 96, 99].includes(weatherCode)) return "Thunderstorm";
  return "Weather";
}

export function detectNearestCity(latitude: number, longitude: number): CityKey {
  return (Object.entries(CITY_COORDINATES) as Array<[CityKey, { lat: number; lon: number; label: string }]>)
    .sort(([, a], [, b]) => {
      const distanceA = Math.hypot(latitude - a.lat, longitude - a.lon);
      const distanceB = Math.hypot(latitude - b.lat, longitude - b.lon);
      return distanceA - distanceB;
    })[0][0];
}

export async function detectUserLocation(): Promise<{ city: CityKey; latitude: number; longitude: number; source: string }> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    const fallback = CITY_COORDINATES.bengaluru;
    return { city: "bengaluru", latitude: fallback.lat, longitude: fallback.lon, source: "Manual fallback" };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        resolve({
          city: detectNearestCity(latitude, longitude),
          latitude,
          longitude,
          source: "Geolocation"
        });
      },
      () => {
        const fallback = CITY_COORDINATES.bengaluru;
        resolve({ city: "bengaluru", latitude: fallback.lat, longitude: fallback.lon, source: "Manual fallback" });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 }
    );
  });
}

export async function fetchLiveWeather(city: CityKey, latitude?: number, longitude?: number): Promise<LiveWeather> {
  const coords = CITY_COORDINATES[city];
  const lat = latitude ?? coords.lat;
  const lon = longitude ?? coords.lon;

  return withCachedPromise(`weather:${lat.toFixed(3)}:${lon.toFixed(3)}`, async () => {
    try {
      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code",
        timezone: "auto"
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        return fallbackWeather(city);
      }
      const data = await response.json();
      const current = data.current;
      const temperature = Number((current?.temperature_2m ?? fallbackWeather(city).temperature).toFixed(1));
      const humidity = Math.round(current?.relative_humidity_2m ?? fallbackWeather(city).humidity);
      return {
        temperature,
        humidity,
        windSpeed: Number((current?.wind_speed_10m ?? fallbackWeather(city).windSpeed).toFixed(1)),
        feelsLike: Number((current?.apparent_temperature ?? heatIndexCelsius(temperature, humidity)).toFixed(1)),
        condition: weatherCodeToCondition(current?.weather_code ?? 0),
        source: "Open-Meteo"
      };
    } catch {
      return fallbackWeather(city);
    }
  }, 25 * 1000);
}

export async function fetchAirQuality(city: CityKey, latitude?: number, longitude?: number) {
  const coords = CITY_COORDINATES[city];
  const fallbackAqi = Math.round(72 + Math.sin(Date.now() / 260000) * 18);
  const lat = latitude ?? coords.lat;
  const lon = longitude ?? coords.lon;

  return withCachedPromise(`aqi:${lat.toFixed(3)}:${lon.toFixed(3)}`, async () => {
    try {
      const openAqUrl = `https://api.openaq.org/v2/latest?coordinates=${lat},${lon}&radius=15000&limit=1`;
      const response = await fetch(openAqUrl, {
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      if (response.ok) {
        const data = await response.json();
        const measurements = data.results?.[0]?.measurements ?? [];
        const pm25 = measurements.find((item: { parameter: string }) => item.parameter === "pm25")?.value ?? 35;
        const pm10 = measurements.find((item: { parameter: string }) => item.parameter === "pm10")?.value ?? 52;
        return {
          aqi: Math.round(Math.max(30, Math.min(180, pm25 * 2.4))),
          pm25: Number(pm25),
          pm10: Number(pm10),
          source: "OpenAQ"
        };
      }
    } catch {
      // Ignore and fall through to fallback.
    }

    return { aqi: fallbackAqi, pm25: 35, pm10: 52, source: "Simulation fallback" };
  }, 25 * 1000);
}
