import type { ApiConfig } from "@/lib/types";

export function resolveAdzunaConfig(config?: Partial<ApiConfig>) {
  const appId = config?.adzunaAppId || process.env.ADZUNA_APP_ID || "";
  const appKey = config?.adzunaAppKey || process.env.ADZUNA_APP_KEY || "";
  const country = config?.country || process.env.ADZUNA_COUNTRY || "us";

  return { appId, appKey, country };
}

export function resolveOpenSkillsBaseUrl(config?: Partial<ApiConfig>) {
  return config?.openSkillsBaseUrl || process.env.OPEN_SKILLS_BASE_URL || "";
}
