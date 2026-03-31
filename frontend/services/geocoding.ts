import { withCachedPromise } from "@/services/cache";

export type IndiaLocation = {
  label: string;
  latitude: number;
  longitude: number;
  state?: string;
  postcode?: string;
  bounds?: [[number, number], [number, number]];
  source: string;
};

export const INDIA_STATES = [
  "Tamil Nadu",
  "Karnataka",
  "Telangana",
  "Kerala",
  "Andhra Pradesh",
  "Maharashtra",
  "Delhi",
  "Punjab",
  "Gujarat",
  "Rajasthan",
  "Uttar Pradesh",
  "West Bengal",
  "Odisha",
  "Madhya Pradesh",
  "Bihar",
  "Assam",
  "Jharkhand",
  "Haryana",
  "Goa",
  "Himachal Pradesh",
  "Uttarakhand",
  "Chhattisgarh",
  "Tripura",
  "Meghalaya",
  "Manipur",
  "Nagaland",
  "Sikkim",
  "Arunachal Pradesh"
] as const;

const MAPBOX_API_KEY = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;
const GEOCODING_API_KEY = process.env.NEXT_PUBLIC_GEOCODING_API_KEY;

function parseBounds(values?: number[]) {
  if (!values || values.length !== 4) {
    return undefined;
  }
  const [minLon, minLat, maxLon, maxLat] = values;
  return [
    [minLat, minLon],
    [maxLat, maxLon]
  ] as [[number, number], [number, number]];
}

async function mapboxSearch(query: string) {
  const accessToken = MAPBOX_API_KEY || GEOCODING_API_KEY;
  if (!accessToken) {
    return null;
  }

  const params = new URLSearchParams({
    access_token: accessToken,
    country: "IN",
    autocomplete: "true",
    limit: "5",
    language: "en",
    types: "place,district,region,postcode,locality,neighborhood,address"
  });
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return (data.features ?? []).map((feature: Record<string, unknown>) => ({
    label: String(feature.place_name ?? query),
    latitude: Number((feature.center as [number, number])[1]),
    longitude: Number((feature.center as [number, number])[0]),
    state: (feature.context as Array<{ text?: string; id?: string }> | undefined)?.find((item) => item.id?.startsWith("region"))?.text,
    postcode: (feature.context as Array<{ text?: string; id?: string }> | undefined)?.find((item) => item.id?.startsWith("postcode"))?.text,
    bounds: parseBounds(feature.bbox as number[] | undefined),
    source: "Mapbox Geocoding"
  })) as IndiaLocation[];
}

async function nominatimSearch(query: string) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    countrycodes: "in",
    limit: "5",
    addressdetails: "1"
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    cache: "no-store",
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return (data as Array<Record<string, unknown>>).map((item) => ({
    label: String(item.display_name ?? query),
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    state: (item.address as { state?: string } | undefined)?.state,
    postcode: (item.address as { postcode?: string } | undefined)?.postcode,
    bounds: parseBounds((item.boundingbox as string[] | undefined)?.map(Number).length === 4
      ? [
          Number((item.boundingbox as string[])[2]),
          Number((item.boundingbox as string[])[0]),
          Number((item.boundingbox as string[])[3]),
          Number((item.boundingbox as string[])[1])
        ]
      : undefined),
    source: "OpenStreetMap Nominatim"
  }));
}

export async function searchIndiaLocations(query: string) {
  const normalized = query.trim();
  if (!normalized) {
    return [];
  }

  return withCachedPromise(`geocode-search:${normalized.toLowerCase()}`, async () => {
    const osmResults = await nominatimSearch(normalized);
    if (osmResults.length > 0) {
      return osmResults;
    }
    const mapboxResults = await mapboxSearch(normalized);
    return mapboxResults ?? [];
  }, 10 * 60 * 1000);
}

export async function geocodeIndianState(state: string) {
  const results = await searchIndiaLocations(`${state}, India`);
  return results[0] ?? null;
}

export async function reverseGeocodeIndiaLocation(latitude: number, longitude: number) {
  return withCachedPromise(`geocode-reverse:${latitude.toFixed(3)}:${longitude.toFixed(3)}`, async () => {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: "jsonv2",
      addressdetails: "1"
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
    if (response.ok) {
      const data = await response.json();
      return {
        label: String(data.display_name ?? `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`),
        latitude,
        longitude,
        state: data.address?.state,
        postcode: data.address?.postcode,
        source: "OpenStreetMap Nominatim"
      } satisfies IndiaLocation;
    }

    const accessToken = MAPBOX_API_KEY || GEOCODING_API_KEY;
    if (accessToken) {
      const mapboxParams = new URLSearchParams({
        access_token: accessToken,
        country: "IN",
        language: "en"
      });
      const mapboxResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?${mapboxParams.toString()}`,
        { cache: "no-store" }
      );
      if (mapboxResponse.ok) {
        const data = await mapboxResponse.json();
        const feature = data.features?.[0];
        if (feature) {
          return {
            label: String(feature.place_name ?? `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`),
            latitude,
            longitude,
            state: (feature.context as Array<{ text?: string; id?: string }> | undefined)?.find((item) => item.id?.startsWith("region"))?.text,
            bounds: parseBounds(feature.bbox as number[] | undefined),
            source: "Mapbox Geocoding"
          } satisfies IndiaLocation;
        }
      }
    }

    return {
      label: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
      latitude,
      longitude,
      source: "Coordinate fallback"
    } satisfies IndiaLocation;
  }, 20 * 60 * 1000);
}
