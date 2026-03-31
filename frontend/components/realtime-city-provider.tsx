"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { getHeatData } from "@/lib/api";
import { HeatCell, HeatDataResponse } from "@/lib/types";
import { reverseGeocodeIndiaLocation, geocodeIndianState, IndiaLocation, searchIndiaLocations } from "@/services/geocoding";
import { calculateHealthRiskScore, calculateHeatRiskScore } from "@/services/heat";
import { fetchPopulationSnapshot } from "@/services/population";
import { CITY_COORDINATES, CityKey, detectNearestCity, detectUserLocation, fetchAirQuality, fetchLiveWeather } from "@/services/weather";

type WeatherSnapshot = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  condition: string;
  iconCode?: string;
  source: string;
};

type AirQualitySnapshot = {
  aqi: number;
  pm25?: number;
  pm10?: number;
  source: string;
};

type PopulationSnapshot = {
  density: number;
  urbanDensity: number;
  source: string;
};

type RealtimeCityContextValue = {
  selectedCity: CityKey;
  setSelectedCity: (city: CityKey) => void;
  selectedLocation: IndiaLocation | null;
  location: { latitude: number; longitude: number; source: string } | null;
  selectedState: string | null;
  setSelectedState: (state: string) => Promise<void>;
  searchResults: IndiaLocation[];
  searchLocations: (query: string) => Promise<void>;
  selectLocation: (location: IndiaLocation) => void;
  weather: WeatherSnapshot | null;
  airQuality: AirQualitySnapshot | null;
  population: PopulationSnapshot | null;
  liveHeatData: HeatDataResponse | null;
  heatRiskScore: number;
  healthRiskScore: number;
  lastUpdated: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const RealtimeCityContext = createContext<RealtimeCityContextValue | undefined>(undefined);
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

function classifyHeatZone(temperature: number): HeatCell["heat_zone"] {
  if (temperature >= 38) return "high";
  if (temperature >= 35) return "medium";
  return "low";
}

function summarize(cells: HeatCell[]) {
  const averageTemperature = cells.reduce((sum, cell) => sum + cell.current_temperature, 0) / cells.length;
  const avgTreeCover = (cells.reduce((sum, cell) => sum + cell.tree_cover, 0) / cells.length) * 100;
  const avgPopulationDensity = cells.reduce((sum, cell) => sum + cell.population_density, 0) / cells.length;
  const avgBuiltDensity = cells.reduce((sum, cell) => sum + cell.built_density, 0) / cells.length;
  const climateScore = Math.max(
    0,
    Math.min(
      100,
      100 - (averageTemperature - 28) * 7.2 + avgTreeCover * 0.28 - avgPopulationDensity / 900 - avgBuiltDensity * 12
    )
  );

  return {
    average_temperature: Number(averageTemperature.toFixed(2)),
    high_heat_cells: cells.filter((cell) => cell.heat_zone === "high").length,
    medium_heat_cells: cells.filter((cell) => cell.heat_zone === "medium").length,
    low_heat_cells: cells.filter((cell) => cell.heat_zone === "low").length,
    avg_tree_cover: Number(avgTreeCover.toFixed(1)),
    avg_population_density: Math.round(avgPopulationDensity),
    climate_score: Number(climateScore.toFixed(1))
  };
}

function synthesizeLiveHeatData(
  base: HeatDataResponse,
  profileCity: CityKey,
  location: IndiaLocation,
  temperature: number,
  humidity: number,
  populationDensity: number
) {
  const cityBias = (["bengaluru", "hyderabad", "chennai", "delhi"] as CityKey[]).indexOf(profileCity) * 0.6;
  const averageBase = base.cells.reduce((sum, cell) => sum + cell.current_temperature, 0) / base.cells.length;
  const baseCenter = {
    latitude: base.cells.reduce((sum, cell) => sum + cell.latitude, 0) / base.cells.length,
    longitude: base.cells.reduce((sum, cell) => sum + cell.longitude, 0) / base.cells.length
  };
  const latitudeShift = location.latitude - baseCenter.latitude;
  const longitudeShift = location.longitude - baseCenter.longitude;
  const humidityBias = Math.max(-1.2, Math.min(1.8, (humidity - 55) * 0.03));

  const cells = base.cells.map((cell, index) => {
    const currentTemperature = Number(
      (cell.current_temperature + (temperature - averageBase) * 0.7 + cityBias + humidityBias + (index % 5 === 0 ? 0.5 : 0)).toFixed(1)
    );
    return {
      ...cell,
      latitude: Number((cell.latitude + latitudeShift).toFixed(4)),
      longitude: Number((cell.longitude + longitudeShift).toFixed(4)),
      current_temperature: currentTemperature,
      population_density: Math.round(cell.population_density * (populationDensity / Math.max(base.summary.avg_population_density, 1))),
      heat_zone: classifyHeatZone(currentTemperature)
    };
  });

  return {
    city: location.label,
    cells,
    summary: summarize(cells)
  };
}

function locationFromPreset(city: CityKey): IndiaLocation {
  const coords = CITY_COORDINATES[city];
  return {
    label: `${coords.label}, India`,
    latitude: coords.lat,
    longitude: coords.lon,
    source: "Preset city"
  };
}

export function RealtimeCityProvider({ children }: { children: ReactNode }) {
  const [selectedCityState, setSelectedCityState] = useState<CityKey>("bengaluru");
  const [selectedLocation, setSelectedLocation] = useState<IndiaLocation | null>(locationFromPreset("bengaluru"));
  const [location, setLocation] = useState<{ latitude: number; longitude: number; source: string } | null>(null);
  const [selectedState, setSelectedStateValue] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<IndiaLocation[]>([]);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualitySnapshot | null>(null);
  const [population, setPopulation] = useState<PopulationSnapshot | null>(null);
  const [liveHeatData, setLiveHeatData] = useState<HeatDataResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const applyLocation = useCallback((nextLocation: IndiaLocation) => {
    setSelectedLocation(nextLocation);
    setLocation({
      latitude: nextLocation.latitude,
      longitude: nextLocation.longitude,
      source: nextLocation.source
    });
    if (nextLocation.state) {
      setSelectedStateValue(nextLocation.state);
    }
    setSelectedCityState(detectNearestCity(nextLocation.latitude, nextLocation.longitude));
    setSearchResults([]);
  }, []);

  const setSelectedCity = useCallback(
    (city: CityKey) => {
      setSelectedCityState(city);
      applyLocation(locationFromPreset(city));
    },
    [applyLocation]
  );

  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = await searchIndiaLocations(query);
    setSearchResults(results);
  }, []);

  const setSelectedState = useCallback(async (state: string) => {
    setSelectedStateValue(state);
    const result = await geocodeIndianState(state);
    if (result) {
      applyLocation({
        ...result,
        state,
        source: result.source
      });
    }
  }, [applyLocation]);

  const refresh = useCallback(async () => {
    const activeLocation = selectedLocation ?? locationFromPreset(selectedCityState);
    setLoading(true);
    setError(null);
    try {
      const [baseData, nextWeather, nextAirQuality, nextPopulation] = await Promise.all([
        getHeatData(),
        fetchLiveWeather(selectedCityState, activeLocation.latitude, activeLocation.longitude),
        fetchAirQuality(selectedCityState, activeLocation.latitude, activeLocation.longitude),
        fetchPopulationSnapshot(selectedCityState, activeLocation.latitude, activeLocation.longitude)
      ]);

      setWeather(nextWeather);
      setAirQuality(nextAirQuality);
      setPopulation(nextPopulation);
      setLiveHeatData(
        synthesizeLiveHeatData(
          baseData,
          selectedCityState,
          activeLocation,
          nextWeather.temperature,
          nextWeather.humidity,
          nextPopulation.density
        )
      );
      setLastUpdated(new Date().toISOString());
    } catch {
      setError("Unable to fetch live smart city data. Using the latest available snapshot.");
    } finally {
      setLoading(false);
    }
  }, [selectedCityState, selectedLocation]);

  useEffect(() => {
    let active = true;
    const savedLocation = window.localStorage.getItem("coolcity-saved-location");
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation) as IndiaLocation;
        applyLocation(parsed);
        return () => {
          active = false;
        };
      } catch {
        // Ignore invalid saved state and continue with geolocation.
      }
    }
    detectUserLocation().then(async (detected) => {
      if (!active) return;
      const reverse = await reverseGeocodeIndiaLocation(detected.latitude, detected.longitude);
      if (!active) return;
      applyLocation({
        ...reverse,
        source: detected.source
      });
      setSelectedCityState(detected.city);
    });
    return () => {
      active = false;
    };
  }, [applyLocation]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!WEBSOCKET_URL) return;
    const socket = new WebSocket(WEBSOCKET_URL);
    socketRef.current = socket;
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as Partial<{ temperature: number; aqi: number; pm25: number; pm10: number }>;
        setWeather((prev) => (prev && payload.temperature ? { ...prev, temperature: payload.temperature } : prev));
        setAirQuality((prev) =>
          prev && payload.aqi
            ? {
                ...prev,
                aqi: payload.aqi,
                pm25: payload.pm25 ?? prev.pm25,
                pm10: payload.pm10 ?? prev.pm10
              }
            : prev
        );
      } catch {
        // Ignore malformed messages and continue polling fallback.
      }
    };
    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, []);

  const heatRiskScore = useMemo(
    () =>
      calculateHeatRiskScore({
        temperature: weather?.temperature ?? 0,
        humidity: weather?.humidity ?? 0,
        populationDensity: population?.density ?? 0,
        greenCover: liveHeatData?.summary.avg_tree_cover ?? 0,
        aqi: airQuality?.aqi ?? 0
      }),
    [airQuality?.aqi, liveHeatData?.summary.avg_tree_cover, population?.density, weather?.humidity, weather?.temperature]
  );

  const healthRiskScore = useMemo(
    () =>
      calculateHealthRiskScore({
        temperature: weather?.temperature ?? 0,
        humidity: weather?.humidity ?? 0,
        aqi: airQuality?.aqi ?? 0,
        populationDensity: population?.density ?? 0
      }),
    [airQuality?.aqi, population?.density, weather?.humidity, weather?.temperature]
  );

  const value = useMemo(
    () => ({
      selectedCity: selectedCityState,
      setSelectedCity,
      selectedLocation,
      location,
      selectedState,
      setSelectedState,
      searchResults,
      searchLocations,
      selectLocation: applyLocation,
      weather,
      airQuality,
      population,
      liveHeatData,
      heatRiskScore,
      healthRiskScore,
      lastUpdated,
      loading,
      error,
      refresh
    }),
    [
      airQuality,
      applyLocation,
      error,
      healthRiskScore,
      heatRiskScore,
      lastUpdated,
      liveHeatData,
      loading,
      location,
      population,
      refresh,
      searchLocations,
      searchResults,
      selectedCityState,
      selectedLocation,
      selectedState,
      setSelectedCity,
      setSelectedState,
      weather
    ]
  );

  return <RealtimeCityContext.Provider value={value}>{children}</RealtimeCityContext.Provider>;
}

export function useRealtimeCityData() {
  const context = useContext(RealtimeCityContext);
  if (!context) {
    throw new Error("useRealtimeCityData must be used within RealtimeCityProvider");
  }
  return context;
}
