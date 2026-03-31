"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, MapPin, Search, Star } from "lucide-react";

import { useRealtimeCityData } from "@/components/realtime-city-provider";
import { INDIA_STATES } from "@/services/geocoding";

export function IndiaLocationPicker() {
  const {
    selectedLocation,
    selectedState,
    setSelectedState,
    searchResults,
    searchLocations,
    selectLocation,
    loading
  } = useRealtimeCityData();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    const timeout = window.setTimeout(() => {
      void searchLocations(trimmed);
      setOpen(true);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [query, searchLocations]);

  return (
    <div className="relative flex min-w-0 flex-col gap-3 sm:min-w-[22rem]">
      <div className="flex flex-col gap-3 xl:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Search city, district, state, or pin code"
            className="w-full rounded-full border border-slate-200 bg-white/88 py-3 pl-10 pr-4 text-sm text-slate-800 shadow-float backdrop-blur-xl outline-none transition focus:border-primary focus:shadow-neon dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-100"
          />
        </div>
        <select
          value={selectedState ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            if (!value) return;
            void setSelectedState(value);
          }}
          className="rounded-full border border-slate-200 bg-white/88 px-4 py-3 text-sm text-slate-800 shadow-float backdrop-blur-xl outline-none transition hover:border-primary dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-100"
        >
          <option value="">Select State</option>
          {INDIA_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      {selectedLocation ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-medium text-emerald-700 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
            <MapPin size={14} />
            {selectedLocation.label}
            {loading ? <LoaderCircle size={14} className="animate-spin" /> : null}
          </div>
          <button
            type="button"
            onClick={() => {
              window.localStorage.setItem("coolcity-saved-location", JSON.stringify(selectedLocation));
              setSaved(true);
              window.setTimeout(() => setSaved(false), 1500);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/85 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
          >
            <Star size={13} className={saved ? "fill-current text-amber-400" : ""} />
            {saved ? "Preference saved" : "Save preference"}
          </button>
        </div>
      ) : null}

      {open && searchResults.length > 0 ? (
        <div className="absolute top-[5.6rem] z-40 max-h-80 w-full overflow-auto rounded-[24px] border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          {searchResults.map((result) => (
            <button
              key={`${result.label}-${result.latitude}-${result.longitude}`}
              type="button"
              onClick={() => {
                selectLocation(result);
                setQuery(result.label);
                setOpen(false);
              }}
              className="flex w-full flex-col items-start rounded-2xl px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/80"
            >
              <span className="font-medium text-slate-900 dark:text-slate-100">{result.label}</span>
              <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {result.state ?? "India"} · {result.source}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
