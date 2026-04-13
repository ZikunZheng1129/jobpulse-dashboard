"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { SafeChart } from "@/components/safe-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEFAULT_API_CONFIG, DEFAULT_PREFERENCES } from "@/lib/constants";
import {
  fetchJobs,
  fetchOpenSkillsNormalizedTitle,
  fetchOpenSkillsRelatedRoles,
  fetchOpenSkillsSuggestions,
} from "@/lib/api-client";
import { aggregateHiringCompanies } from "@/lib/normalizers";
import { getApiConfig, getPreferences } from "@/lib/storage";
import type {
  ApiConfig,
  NormalizedJob,
  OpenSkillsNormalizedTitle,
  OpenSkillsRelatedRole,
  OpenSkillsSuggestion,
} from "@/lib/types";

const SALARY_MIN_POSTINGS = 3;
const SALARY_MIN_SAMPLES = 2;
const SALARY_MIN_COVERAGE = 0.5;

function compactCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function tooltipSalaryFormatter(value: unknown): string {
  return typeof value === "number" ? compactCurrency(value) : "";
}

function salaryPoint(job: NormalizedJob): number | null {
  if (typeof job.salaryMin === "number" && typeof job.salaryMax === "number") {
    return (job.salaryMin + job.salaryMax) / 2;
  }
  if (typeof job.salaryMin === "number") return job.salaryMin;
  if (typeof job.salaryMax === "number") return job.salaryMax;
  return null;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function aggregateLocations(jobs: NormalizedJob[]) {
  const counts = new Map<string, number>();
  for (const job of jobs) {
    counts.set(job.location, (counts.get(job.location) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function salaryBandData(jobs: NormalizedJob[]) {
  const bands = [
    { band: "<60k", low: 0, high: 60000, count: 0 },
    { band: "60k-80k", low: 60000, high: 80000, count: 0 },
    { band: "80k-100k", low: 80000, high: 100000, count: 0 },
    { band: "100k-130k", low: 100000, high: 130000, count: 0 },
    { band: "130k+", low: 130000, high: Number.POSITIVE_INFINITY, count: 0 },
  ];

  for (const job of jobs) {
    const midpoint = salaryPoint(job);
    if (midpoint === null) continue;

    const band = bands.find((item) => midpoint >= item.low && midpoint < item.high);
    if (band) band.count += 1;
  }

  return bands.map(({ band, count }) => ({ band, count }));
}

function openSkillsTermData(
  normalized: OpenSkillsNormalizedTitle[],
  related: OpenSkillsRelatedRole[],
  suggestions: OpenSkillsSuggestion[],
) {
  const counts = new Map<string, number>();

  for (const item of normalized) {
    const term = item.normalized.trim();
    if (term) counts.set(term, (counts.get(term) ?? 0) + 1);
  }

  for (const item of related) {
    const term = item.title.trim();
    if (term) counts.set(term, (counts.get(term) ?? 0) + 1);
  }

  for (const item of suggestions) {
    const term = item.label.trim();
    if (term) counts.set(term, (counts.get(term) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function aggregateMedianSalaryByGroup(
  jobs: NormalizedJob[],
  getKey: (job: NormalizedJob) => string,
  label: "company" | "location",
) {
  const buckets = new Map<string, { postings: number; salaries: number[] }>();

  for (const job of jobs) {
    const key = getKey(job).trim();
    if (!key) continue;

    const current = buckets.get(key) ?? { postings: 0, salaries: [] };
    current.postings += 1;

    const point = salaryPoint(job);
    if (point !== null) current.salaries.push(point);

    buckets.set(key, current);
  }

  return [...buckets.entries()]
    .map(([name, data]) => {
      const coverage = data.postings > 0 ? data.salaries.length / data.postings : 0;
      return {
        name,
        postings: data.postings,
        salarySamples: data.salaries.length,
        coverage,
        medianSalary: data.salaries.length > 0 ? median(data.salaries) : null,
      };
    })
    .filter(
      (item) =>
        item.postings >= SALARY_MIN_POSTINGS &&
        item.salarySamples >= SALARY_MIN_SAMPLES &&
        item.coverage >= SALARY_MIN_COVERAGE &&
        typeof item.medianSalary === "number",
    )
    .sort((a, b) => (b.medianSalary ?? 0) - (a.medianSalary ?? 0))
    .slice(0, 8)
    .map((item) => ({
      [label]: item.name,
      medianSalary: item.medianSalary,
      postings: item.postings,
      salarySamples: item.salarySamples,
      coverage: item.coverage,
    }));
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-72 items-center justify-center text-sm text-neutral-500">
      {message}
    </div>
  );
}

export function InsightsClient() {
  const [config, setConfig] = useState<ApiConfig>(DEFAULT_API_CONFIG);
  const [keyword, setKeyword] = useState(DEFAULT_PREFERENCES.keyword);
  const [location, setLocation] = useState(DEFAULT_PREFERENCES.location);
  const [jobs, setJobs] = useState<NormalizedJob[]>([]);
  const [titleInput, setTitleInput] = useState("software engineer");
  const [normalized, setNormalized] = useState<OpenSkillsNormalizedTitle[]>([]);
  const [related, setRelated] = useState<OpenSkillsRelatedRole[]>([]);
  const [suggestions, setSuggestions] = useState<OpenSkillsSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextConfig = getApiConfig();
      const nextPreferences = getPreferences();

      setConfig(nextConfig);
      setKeyword(nextPreferences.keyword);
      setLocation(nextPreferences.location);
      setInitialized(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const companies = useMemo(() => aggregateHiringCompanies(jobs), [jobs]);
  const locations = useMemo(() => aggregateLocations(jobs), [jobs]);
  const salaryBands = useMemo(() => salaryBandData(jobs), [jobs]);
  const skillTerms = useMemo(
    () => openSkillsTermData(normalized, related, suggestions),
    [normalized, related, suggestions],
  );
  const salaryByCompany = useMemo(
    () => aggregateMedianSalaryByGroup(jobs, (job) => job.company, "company"),
    [jobs],
  );
  const salaryByLocation = useMemo(
    () => aggregateMedianSalaryByGroup(jobs, (job) => job.location, "location"),
    [jobs],
  );

  const runInsights = async () => {
    if (!initialized) return;

    setLoading(true);

    const [jobsResult, normResult, relatedResult, suggestionResult] = await Promise.all([
      fetchJobs({
        keyword,
        location,
        sortBy: "hiring_activity",
        config,
      }),
      fetchOpenSkillsNormalizedTitle(config, titleInput),
      fetchOpenSkillsRelatedRoles(config, titleInput),
      fetchOpenSkillsSuggestions(config, titleInput),
    ]);

    setJobs(jobsResult.jobs ?? []);
    setNormalized(normResult.results ?? []);
    setRelated(relatedResult.results ?? []);
    setSuggestions(suggestionResult.results ?? []);

    setLoading(false);
  };

  if (!initialized) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading Insights</CardTitle>
            <CardDescription>Loading local query defaults.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Market Insights</CardTitle>
          <CardDescription>
            Rankings use hiring activity, not company size. Results reflect your query and API
            coverage.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Keyword"
          />
          <Input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Location"
          />
          <Input
            value={titleInput}
            onChange={(event) => setTitleInput(event.target.value)}
            placeholder="Title for Open Skills"
          />
          <Button onClick={runInsights} disabled={loading}>
            {loading ? "Loading..." : "Refresh Insights"}
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Hiring Companies by Open Roles</CardTitle>
            <CardDescription>Open roles by company in this query sample.</CardDescription>
          </CardHeader>
          <CardContent className="h-72 min-h-72">
            {companies.length === 0 ? (
              <ChartEmptyState message="Run insights to view company hiring activity." />
            ) : (
              <SafeChart>
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                  <BarChart layout="vertical" data={companies} margin={{ left: 8, right: 18, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e5e5" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="openRoleCount" fill="#404040" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SafeChart>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salary Distribution</CardTitle>
            <CardDescription>
              Bands from listings with salary fields in the current result set.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 min-h-72">
            {salaryBands.every((item) => item.count === 0) ? (
              <ChartEmptyState message="Not enough salary data in current results." />
            ) : (
              <SafeChart>
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                  <BarChart layout="vertical" data={salaryBands} margin={{ left: 8, right: 18, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e5e5" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="band" width={90} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#737373" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SafeChart>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hiring Activity by Location</CardTitle>
            <CardDescription>
              Role counts by location; coverage depends on listing completeness.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 min-h-72">
            {locations.length === 0 ? (
              <ChartEmptyState message="Not enough location detail to chart this view." />
            ) : (
              <SafeChart>
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                  <BarChart layout="vertical" data={locations} margin={{ left: 8, right: 18, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e5e5" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="location" width={140} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#525252" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SafeChart>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recurring Skill Terms</CardTitle>
            <CardDescription>
              Frequency from Open Skills normalized titles, related roles, and suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 min-h-72">
            {skillTerms.length === 0 ? (
              <ChartEmptyState message="Run insights to load recurring skill terms." />
            ) : (
              <SafeChart>
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                  <BarChart layout="vertical" data={skillTerms} margin={{ left: 8, right: 18, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e5e5" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="term" width={160} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#404040" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SafeChart>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Salary by Hiring Company</CardTitle>
            <CardDescription>
              Median salary by company. Includes only groups with at least {SALARY_MIN_POSTINGS}
              postings, {SALARY_MIN_SAMPLES} salary entries, and {Math.round(SALARY_MIN_COVERAGE * 100)}%
              salary coverage.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 min-h-72">
            {salaryByCompany.length === 0 ? (
              <ChartEmptyState message="Salary coverage is too sparse for company-level ranking." />
            ) : (
              <SafeChart>
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                  <BarChart layout="vertical" data={salaryByCompany} margin={{ left: 8, right: 18, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e5e5" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => compactCurrency(Number(value))}
                    />
                    <YAxis type="category" dataKey="company" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => tooltipSalaryFormatter(value)}
                      labelFormatter={(label) => `Company: ${label}`}
                    />
                    <Bar dataKey="medianSalary" fill="#525252" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SafeChart>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salary by Location</CardTitle>
            <CardDescription>
              Median salary by location using the same minimum data thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 min-h-72">
            {salaryByLocation.length === 0 ? (
              <ChartEmptyState message="Salary coverage is too sparse for location-level ranking." />
            ) : (
              <SafeChart>
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                  <BarChart layout="vertical" data={salaryByLocation} margin={{ left: 8, right: 18, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e5e5" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => compactCurrency(Number(value))}
                    />
                    <YAxis type="category" dataKey="location" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => tooltipSalaryFormatter(value)}
                      labelFormatter={(label) => `Location: ${label}`}
                    />
                    <Bar dataKey="medianSalary" fill="#737373" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SafeChart>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
