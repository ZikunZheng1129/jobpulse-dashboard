import { NextResponse } from "next/server";

import { normalizeOpenSkillsSuggestions } from "@/lib/normalizers";
import { proxyOpenSkills } from "@/lib/open-skills-proxy";

export async function POST(request: Request) {
  const body = await request.json();
  const query = String(body.query ?? "").trim();

  if (!query) return NextResponse.json({ results: [] });

  const proxied = await proxyOpenSkills(body, [
    "/autocomplete",
    "/api/autocomplete",
    "/titles/autocomplete",
  ]);

  if (proxied.ok) {
    return NextResponse.json({ results: normalizeOpenSkillsSuggestions(proxied.data) });
  }

  if (body.config?.useDemoMode) {
    return NextResponse.json({
      results: [
        { label: "Software Engineer", value: "software engineer" },
        { label: "Senior Software Engineer", value: "senior software engineer" },
        { label: "Backend Engineer", value: "backend engineer" },
      ].filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
      usedDemoData: true,
    });
  }

  return NextResponse.json({ error: proxied.message, results: [] }, { status: proxied.status });
}
