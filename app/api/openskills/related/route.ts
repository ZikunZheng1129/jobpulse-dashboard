import { NextResponse } from "next/server";

import { normalizeOpenSkillsRelated } from "@/lib/normalizers";
import { proxyOpenSkills } from "@/lib/open-skills-proxy";

export async function POST(request: Request) {
  const body = await request.json();
  const title = String(body.title ?? "").trim();

  if (!title) return NextResponse.json({ results: [] });

  const proxied = await proxyOpenSkills(body, [
    "/related",
    "/api/related",
    "/titles/related",
  ]);

  if (proxied.ok) {
    return NextResponse.json({ results: normalizeOpenSkillsRelated(proxied.data) });
  }

  if (body.config?.useDemoMode) {
    return NextResponse.json({
      results: [
        { title: "Platform Engineer", score: 0.84 },
        { title: "DevOps Engineer", score: 0.76 },
        { title: "Site Reliability Engineer", score: 0.72 },
      ],
      usedDemoData: true,
    });
  }

  return NextResponse.json({ error: proxied.message, results: [] }, { status: proxied.status });
}
