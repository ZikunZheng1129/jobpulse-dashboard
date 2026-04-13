import { NextResponse } from "next/server";

import { resolveOpenSkillsBaseUrl } from "@/lib/server-config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const baseUrl = resolveOpenSkillsBaseUrl(body);

    if (!baseUrl) {
      return NextResponse.json({
        ok: false,
        message: "Open Skills base URL not set. This API is optional.",
      });
    }

    const candidates = ["/health", "/", "/api/health"];
    for (const path of candidates) {
      try {
        const response = await fetch(new URL(path, baseUrl), { cache: "no-store" });
        if (response.ok) {
          return NextResponse.json({
            ok: true,
            message: `Open Skills connected via ${path}`,
          });
        }
      } catch {
        // try next endpoint
      }
    }

    return NextResponse.json(
      {
        ok: false,
        message: "Open Skills endpoint unreachable. Verify base URL and CORS/server availability.",
      },
      { status: 400 },
    );
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
