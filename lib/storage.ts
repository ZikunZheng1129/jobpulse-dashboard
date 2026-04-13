"use client";

import { DEFAULT_API_CONFIG, DEFAULT_PREFERENCES, STORAGE_KEYS } from "@/lib/constants";
import type {
  ApiConfig,
  ApiConnectionStatus,
  DefaultSearchPreferences,
  SearchHistoryItem,
} from "@/lib/types";

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function hasWindow() {
  return typeof window !== "undefined";
}

export function getApiConfig(): ApiConfig {
  if (!hasWindow()) return DEFAULT_API_CONFIG;
  return safeParse<ApiConfig>(
    window.localStorage.getItem(STORAGE_KEYS.apiConfig),
    DEFAULT_API_CONFIG,
  );
}

export function saveApiConfig(config: ApiConfig) {
  if (!hasWindow()) return;
  window.localStorage.setItem(STORAGE_KEYS.apiConfig, JSON.stringify(config));
}

export function clearApiConfig() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(STORAGE_KEYS.apiConfig);
}

export function getConnectionStatus(): ApiConnectionStatus {
  if (!hasWindow()) return { adzuna: "idle", openSkills: "idle" };
  return safeParse<ApiConnectionStatus>(
    window.localStorage.getItem(STORAGE_KEYS.connectionStatus),
    {
      adzuna: "idle",
      openSkills: "idle",
    },
  );
}

export function saveConnectionStatus(status: ApiConnectionStatus) {
  if (!hasWindow()) return;
  window.localStorage.setItem(STORAGE_KEYS.connectionStatus, JSON.stringify(status));
}

export function getRecentSearches(): SearchHistoryItem[] {
  if (!hasWindow()) return [];
  return safeParse<SearchHistoryItem[]>(
    window.localStorage.getItem(STORAGE_KEYS.recentSearches),
    [],
  );
}

export function pushRecentSearch(search: Omit<SearchHistoryItem, "id" | "createdAt">) {
  if (!hasWindow()) return;
  const next: SearchHistoryItem = {
    ...search,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  const current = getRecentSearches();
  const deduped = current.filter(
    (item) => !(item.keyword === next.keyword && item.location === next.location),
  );
  const final = [next, ...deduped].slice(0, 8);
  window.localStorage.setItem(STORAGE_KEYS.recentSearches, JSON.stringify(final));
}

export function getPreferences(): DefaultSearchPreferences {
  if (!hasWindow()) return DEFAULT_PREFERENCES;
  return safeParse<DefaultSearchPreferences>(
    window.localStorage.getItem(STORAGE_KEYS.preferences),
    DEFAULT_PREFERENCES,
  );
}

export function savePreferences(preferences: DefaultSearchPreferences) {
  if (!hasWindow()) return;
  window.localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(preferences));
}
