import type { ApiConfig, NormalizedJob } from "@/lib/types";

interface JobsResponse {
  jobs: NormalizedJob[];
  count: number;
  page: number;
  usedDemoData?: boolean;
  error?: string;
}

export async function fetchJobs(params: {
  keyword: string;
  location: string;
  page?: number;
  sortBy?: "newest" | "salary_desc" | "hiring_activity";
  remoteOnly?: boolean;
  config: ApiConfig;
}): Promise<JobsResponse> {
  const response = await fetch("/api/adzuna/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    return {
      jobs: [],
      count: 0,
      page: params.page ?? 1,
      error: body?.error ?? "Failed to load jobs",
    };
  }

  return response.json();
}

export async function testAdzunaConnection(config: ApiConfig) {
  const response = await fetch("/api/adzuna/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  return response.json();
}

export async function testOpenSkillsConnection(config: ApiConfig) {
  const response = await fetch("/api/openskills/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  return response.json();
}

export async function fetchOpenSkillsSuggestions(config: ApiConfig, query: string) {
  const response = await fetch("/api/openskills/autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config, query }),
  });

  return response.json();
}

export async function fetchOpenSkillsNormalizedTitle(config: ApiConfig, title: string) {
  const response = await fetch("/api/openskills/normalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config, title }),
  });

  return response.json();
}

export async function fetchOpenSkillsRelatedRoles(config: ApiConfig, title: string) {
  const response = await fetch("/api/openskills/related", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config, title }),
  });

  return response.json();
}
