import type { NormalizedJob, SearchHistoryItem } from "@/lib/types";

export function normalizeLocationLabel(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

function canonicalKey(value: string): string {
  return normalizeLocationLabel(value).toLowerCase();
}

export function buildLocationSuggestions(input: {
  jobs: NormalizedJob[];
  recentSearches: SearchHistoryItem[];
  currentValue?: string;
  limit?: number;
}): string[] {
  const { jobs, recentSearches, currentValue = "", limit = 12 } = input;
  const seen = new Set<string>();
  const suggestions: string[] = [];

  const add = (candidate: string) => {
    const normalized = normalizeLocationLabel(candidate);
    if (!normalized) return;
    const key = canonicalKey(normalized);
    if (seen.has(key)) return;
    seen.add(key);
    suggestions.push(normalized);
  };

  for (const item of recentSearches) {
    add(item.location);
  }

  for (const job of jobs) {
    add(job.location);
  }

  const needle = normalizeLocationLabel(currentValue).toLowerCase();
  const filtered = needle
    ? suggestions.filter((item) => item.toLowerCase().includes(needle))
    : suggestions;

  return filtered.slice(0, limit);
}
