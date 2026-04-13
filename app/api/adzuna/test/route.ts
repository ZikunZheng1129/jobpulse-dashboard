import { NextResponse } from "next/server";

import { resolveAdzunaConfig } from "@/lib/server-config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appId, appKey, country } = resolveAdzunaConfig(body);

    if (!appId || !appKey) {
      return NextResponse.json(
        { ok: false, message: "Missing Adzuna App ID or App Key" },
        { status: 400 },
      );
    }

    const url = new URL(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1`,
    );
    url.searchParams.set("app_id", appId);
    url.searchParams.set("app_key", appKey);
    url.searchParams.set("results_per_page", "1");
    url.searchParams.set("what", "software engineer");

    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        {
          ok: false,
          message: `Adzuna test failed (${response.status}): ${text.slice(0, 200)}`,
        },
        { status: response.status },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Adzuna connected successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
