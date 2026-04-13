import { NextResponse } from "next/server";

import { normalizeOpenSkillsTitle } from "@/lib/normalizers";
import { proxyOpenSkills } from "@/lib/open-skills-proxy";

export async function POST(request: Request) {
  const body = await request.json();
  const title = String(body.title ?? "").trim();

  if (!title) return NextResponse.json({ results: [] });

  const proxied = await proxyOpenSkills(body, [
    "/normalize",
    "/api/normalize",
    "/titles/normalize",
  ]);

  if (proxied.ok) {
    return NextResponse.json({ results: normalizeOpenSkillsTitle(proxied.data) });
  }

  if (body.config?.useDemoMode) {
    return NextResponse.json({
      results: [
        { original: title, normalized: "Software Engineer", confidence: 0.82 },
        { original: title, normalized: "Backend Engineer", confidence: 0.73 },
      ],
      usedDemoData: true,
    });
  }

  return NextResponse.json({ error: proxied.message, results: [] }, { status: proxied.status });
}
