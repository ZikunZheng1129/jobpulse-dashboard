"use client";

import { useEffect, useMemo, useState } from "react";

import { JobsTable } from "@/components/jobs-table";
import { LocationCombobox } from "@/components/location-combobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DEFAULT_API_CONFIG, DEFAULT_PREFERENCES } from "@/lib/constants";
import { fetchJobs } from "@/lib/api-client";
import { buildLocationSuggestions } from "@/lib/location-utils";
import { getApiConfig, getPreferences, getRecentSearches } from "@/lib/storage";
import type { ApiConfig, NormalizedJob, SearchHistoryItem } from "@/lib/types";

export function JobsClient() {
  const [config, setConfig] = useState<ApiConfig>(DEFAULT_API_CONFIG);
  const [keyword, setKeyword] = useState(DEFAULT_PREFERENCES.keyword);
  const [location, setLocation] = useState(DEFAULT_PREFERENCES.location);
  const [remoteOnly, setRemoteOnly] = useState(DEFAULT_PREFERENCES.remoteOnly);
  const [sortBy, setSortBy] = useState<"newest" | "salary_desc" | "hiring_activity">(
    "newest",
  );
  const [jobs, setJobs] = useState<NormalizedJob[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextConfig = getApiConfig();
      const nextPreferences = getPreferences();
      setConfig(nextConfig);
      setKeyword(nextPreferences.keyword);
      setLocation(nextPreferences.location);
      setRemoteOnly(nextPreferences.remoteOnly);
      setRecentSearches(getRecentSearches().slice(0, 8));
      setInitialized(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const locationSuggestions = useMemo(
    () => buildLocationSuggestions({ jobs, recentSearches, currentValue: location }),
    [jobs, recentSearches, location],
  );

  const runSearch = async (nextPage = 1) => {
    if (!initialized) return;

    setLoading(true);
    setError(null);

    const result = await fetchJobs({
      keyword,
      location,
      page: nextPage,
      sortBy,
      remoteOnly,
      config,
    });

    if (result.error) {
      setError(result.error);
      setJobs([]);
    } else {
      setJobs(nextPage === 1 ? result.jobs : [...jobs, ...result.jobs]);
      setPage(nextPage);
    }

    setLoading(false);
  };

  if (!initialized) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading Jobs Explorer</CardTitle>
            <CardDescription>Loading local search defaults.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Jobs Explorer</CardTitle>
          <CardDescription>
            Browse live listings by recency, salary, or hiring activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            placeholder="Keyword"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <LocationCombobox
            value={location}
            onChange={setLocation}
            options={locationSuggestions}
            placeholder="Location"
          />
          <Select
            value={remoteOnly ? "remote" : "all"}
            onChange={(event) => setRemoteOnly(event.target.value === "remote")}
          >
            <option value="all">All jobs</option>
            <option value="remote">Remote only</option>
          </Select>
          <Select
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as "newest" | "salary_desc" | "hiring_activity")
            }
          >
            <option value="newest">Newest</option>
            <option value="salary_desc">Salary descending</option>
            <option value="hiring_activity">Hiring activity</option>
          </Select>
          <Button onClick={() => runSearch(1)} disabled={loading}>
            {loading ? "Loading..." : "Search"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="pt-5 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <JobsTable jobs={jobs} />

      <Button variant="outline" onClick={() => runSearch(page + 1)} disabled={loading}>
        Load more
      </Button>
    </div>
  );
}
