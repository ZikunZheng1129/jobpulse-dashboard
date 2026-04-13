import { resolveOpenSkillsBaseUrl } from "@/lib/server-config";

export async function proxyOpenSkills(
  payload: {
    config?: { openSkillsBaseUrl?: string };
    query?: string;
    title?: string;
  },
  pathCandidates: string[],
) {
  const baseUrl = resolveOpenSkillsBaseUrl(payload.config);

  if (!baseUrl) {
    return {
      ok: false,
      status: 400,
      message: "Open Skills base URL is not configured.",
      data: null,
    };
  }

  for (const path of pathCandidates) {
    try {
      const url = new URL(path, baseUrl);
      if (payload.query) url.searchParams.set("q", payload.query);
      if (payload.title) url.searchParams.set("title", payload.title);

      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json().catch(() => null);
        return { ok: true, status: 200, message: "ok", data };
      }
    } catch {
      // continue
    }
  }

  return {
    ok: false,
    status: 502,
    message: "Open Skills request failed across known endpoint patterns.",
    data: null,
  };
}
