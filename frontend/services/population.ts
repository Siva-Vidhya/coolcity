import { withCachedPromise } from "@/services/cache";
import { CityKey, CITY_COORDINATES } from "@/services/weather";

const GEONAMES_USERNAME = process.env.NEXT_PUBLIC_GEONAMES_USERNAME ?? "demo";

export type PopulationSnapshot = {
  density: number;
  urbanDensity: number;
  source: string;
};

function buildGeoJsonSquare(latitude: number, longitude: number, delta = 0.01) {
  return JSON.stringify({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [[
            [longitude - delta, latitude - delta],
            [longitude + delta, latitude - delta],
            [longitude + delta, latitude + delta],
            [longitude - delta, latitude + delta],
            [longitude - delta, latitude - delta]
          ]]
        }
      }
    ]
  });
}

function squareAreaKm2(latitude: number, delta = 0.01) {
  const northSouthKm = 111 * delta * 2;
  const eastWestKm = 111 * Math.cos((latitude * Math.PI) / 180) * delta * 2;
  return Math.max(1, northSouthKm * eastWestKm);
}

export async function fetchPopulationSnapshot(city: CityKey, latitude?: number, longitude?: number): Promise<PopulationSnapshot> {
  const coords = CITY_COORDINATES[city];
  const lat = latitude ?? coords.lat;
  const lon = longitude ?? coords.lon;
  const fallback = {
    density: Math.round(8200 + Object.keys(CITY_COORDINATES).indexOf(city) * 1400),
    urbanDensity: Math.round(5400 + Object.keys(CITY_COORDINATES).indexOf(city) * 900),
    source: "Seeded urban dataset"
  };

  return withCachedPromise(`population:${lat.toFixed(3)}:${lon.toFixed(3)}`, async () => {
    try {
      const query = new URLSearchParams({
        dataset: "wpgppop",
        year: "2020",
        geojson: buildGeoJsonSquare(lat, lon),
        runasync: "false"
      });
      const response = await fetch(`https://api.worldpop.org/v1/services/stats?${query.toString()}`, {
        cache: "no-store"
      });
      if (response.ok) {
        const data = await response.json();
        const totalPopulation = Number(data.data?.total_population ?? 0);
        if (totalPopulation > 0) {
          const areaKm2 = squareAreaKm2(lat);
          const density = Math.round(totalPopulation / areaKm2);
          return {
            density: Math.max(fallback.density, density),
            urbanDensity: Math.round(Math.max(fallback.urbanDensity, density * 0.72)),
            source: "WorldPop"
          };
        }
      }
    } catch {
      // ignore and fall through
    }

    try {
      const response = await fetch(
        `https://secure.geonames.org/findNearbyPlaceNameJSON?lat=${lat}&lng=${lon}&username=${GEONAMES_USERNAME}`,
        { cache: "no-store" }
      );
      if (!response.ok) return fallback;
      const data = await response.json();
      const population = Number(data.geonames?.[0]?.population ?? 0);
      if (!population) return fallback;
      return {
        density: Math.round(Math.max(fallback.density, population / 8)),
        urbanDensity: Math.round(Math.max(fallback.urbanDensity, population / 14)),
        source: "GeoNames"
      };
    } catch {
      return fallback;
    }
  }, 10 * 60 * 1000);
}
