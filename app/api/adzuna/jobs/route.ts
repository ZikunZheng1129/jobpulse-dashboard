import { NextResponse } from "next/server";

import { DEMO_JOBS } from "@/lib/constants";
import { normalizeAdzunaJob } from "@/lib/normalizers";
import { resolveAdzunaConfig } from "@/lib/server-config";

function sortJobs(
  jobs: ReturnType<typeof normalizeAdzunaJob>[],
  sortBy: "newest" | "salary_desc" | "hiring_activity" = "newest",
) {
  if (sortBy === "salary_desc") {
    return jobs.sort((a, b) => (b.salaryMax ?? 0) - (a.salaryMax ?? 0));
  }

  if (sortBy === "hiring_activity") {
    const companyCount = new Map<string, number>();
    for (const job of jobs) {
      companyCount.set(job.company, (companyCount.get(job.company) ?? 0) + 1);
    }

    return jobs.sort(
      (a, b) =>
        (companyCount.get(b.company) ?? 0) - (companyCount.get(a.company) ?? 0),
    );
  }

  return jobs.sort((a, b) => {
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bDate - aDate;
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const keyword = String(body.keyword ?? "software engineer");
    const location = String(body.location ?? "United States");
    const page = Number(body.page ?? 1);
    const sortBy = (body.sortBy ?? "newest") as
      | "newest"
      | "salary_desc"
      | "hiring_activity";
    const remoteOnly = Boolean(body.remoteOnly);

    const { appId, appKey, country } = resolveAdzunaConfig(body.config);
    const useDemoMode = Boolean(body.config?.useDemoMode);

    if (!appId || !appKey) {
      if (useDemoMode) {
        return NextResponse.json({
          jobs: sortJobs([...DEMO_JOBS], sortBy),
          count: DEMO_JOBS.length,
          page,
          usedDemoData: true,
        });
      }

      return NextResponse.json(
        {
          jobs: [],
          count: 0,
          page,
          error: "Missing Adzuna credentials. Add them in Settings or enable demo mode.",
        },
        { status: 400 },
      );
    }

    const url = new URL(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`,
    );

    url.searchParams.set("app_id", appId);
    url.searchParams.set("app_key", appKey);
    url.searchParams.set("what", keyword);
    url.searchParams.set("where", location);
    url.searchParams.set("results_per_page", "20");
    url.searchParams.set("content-type", "application/json");

    if (remoteOnly) {
      url.searchParams.set("what_or", "remote");
    }

    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      const text = await response.text();

      if (useDemoMode) {
        return NextResponse.json({
          jobs: sortJobs([...DEMO_JOBS], sortBy),
          count: DEMO_JOBS.length,
          page,
          usedDemoData: true,
          error: `Adzuna unavailable (${response.status}). Showing demo data.`,
        });
      }

      return NextResponse.json(
        {
          jobs: [],
          count: 0,
          page,
          error: `Adzuna error (${response.status}): ${text.slice(0, 250)}`,
        },
        { status: response.status },
      );
    }

    const payload = await response.json();
    const jobs = Array.isArray(payload.results)
      ? payload.results.map(normalizeAdzunaJob)
      : [];

    const sorted = sortJobs(jobs, sortBy);

    return NextResponse.json({
      jobs: sorted,
      count: Number(payload.count ?? sorted.length),
      page,
      usedDemoData: false,
    });
  } catch (error) {
    return NextResponse.json(
      {
        jobs: [],
        count: 0,
        page: 1,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}
