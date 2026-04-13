"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { LocationCombobox } from "@/components/location-combobox";
import { SafeChart } from "@/components/safe-chart";
import { SetupRequiredCard } from "@/components/setup-required-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEFAULT_API_CONFIG, DEFAULT_PREFERENCES } from "@/lib/constants";
import { fetchJobs } from "@/lib/api-client";
import { buildLocationSuggestions } from "@/lib/location-utils";
import { aggregateHiringCompanies } from "@/lib/normalizers";
import { getApiConfig, getPreferences, getRecentSearches, pushRecentSearch } from "@/lib/storage";
import type { ApiConfig, NormalizedJob, SearchHistoryItem } from "@/lib/types";
import { formatDateLabel } from "@/lib/utils";

function parseSalarySnapshot(jobs: NormalizedJob[]) {
  const salaryValues = jobs
    .flatMap((job) => [job.salaryMin, job.salaryMax])
    .filter((v): v is number => typeof v === "number");

  if (salaryValues.length === 0) return "Limited salary data";

  const avg = salaryValues.reduce((sum, value) => sum + value, 0) / salaryValues.length;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(avg);
}

export function DashboardClient() {
  const [config, setConfig] = useState<ApiConfig>(DEFAULT_API_CONFIG);
  const [jobs, setJobs] = useState<NormalizedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [keyword, setKeyword] = useState(DEFAULT_PREFERENCES.keyword);
  const [location, setLocation] = useState(DEFAULT_PREFERENCES.location);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextConfig = getApiConfig();
      const nextPreferences = getPreferences();
      const nextRecent = getRecentSearches().slice(0, 6);

      setConfig(nextConfig);
      setKeyword(nextPreferences.keyword);
      setLocation(nextPreferences.location);
      setRecentSearches(nextRecent);
      setInitialized(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!initialized) return;

    async function run() {
      setLoading(true);
      setError(null);

      const result = await fetchJobs({
        keyword,
        location,
        page: 1,
        sortBy: "hiring_activity",
        config,
      });

      if (result.error) {
        setError(result.error);
        setJobs([]);
      } else {
        setJobs(result.jobs);
      }

      setLoading(false);
    }

    run();
  }, [config, keyword, location, initialized]);

  const companies = useMemo(() => aggregateHiringCompanies(jobs), [jobs]);
  const locationSuggestions = useMemo(
    () => buildLocationSuggestions({ jobs, recentSearches, currentValue: location }),
    [jobs, recentSearches, location],
  );

  const topCompany = companies[0]?.name ?? "N/A";
  const salarySnapshot = parseSalarySnapshot(jobs);
  const missingConfig = !config.adzunaAppId || !config.adzunaAppKey;

  if (!initialized) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading Dashboard</CardTitle>
            <CardDescription>Loading local settings.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {missingConfig && <SetupRequiredCard />}

      <Card>
        <CardHeader>
          <CardTitle>Market Query</CardTitle>
          <CardDescription>Search hiring activity by role and location.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Keyword"
          />
          <LocationCombobox
            value={location}
            onChange={setLocation}
            options={locationSuggestions}
            placeholder="Location"
          />
          <Button
            onClick={() => {
              pushRecentSearch({ keyword, location });
              setRecentSearches(getRecentSearches().slice(0, 6));
            }}
          >
            Save Query
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Live roles in current sample</CardDescription>
            <CardTitle>{loading ? "..." : jobs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Top hiring company</CardDescription>
            <CardTitle className="line-clamp-1">{topCompany}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Salary snapshot</CardDescription>
            <CardTitle className="line-clamp-1">{salarySnapshot}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Top Hiring Companies</CardTitle>
          <CardDescription>
            Ranked by open role count and posting frequency, not company size.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-72 min-h-72">
          <SafeChart>
            <ResponsiveContainer width="100%" height="100%" minHeight={240}>
              <BarChart data={companies} margin={{ left: 0, right: 10, top: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="openRoleCount" fill="#404040" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SafeChart>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="pt-5 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Queries</CardTitle>
          <CardDescription>
            Results depend on your current query and API coverage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentSearches.length === 0 && (
            <p className="text-sm text-neutral-500">No recent queries yet.</p>
          )}
          {recentSearches.map((item) => (
            <div key={item.id} className="rounded-md border border-neutral-200 p-3 text-sm">
              <p className="font-medium">{item.keyword}</p>
              <p className="text-neutral-600">{item.location}</p>
              <p className="text-xs text-neutral-500">{formatDateLabel(item.createdAt)}</p>
            </div>
          ))}
          <Link href="/insights" className="inline-block text-sm text-neutral-700 underline">
            Open insights page
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
