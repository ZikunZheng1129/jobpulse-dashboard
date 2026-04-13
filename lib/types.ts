export type ApiConnectionState = "connected" | "error" | "idle" | "testing";

export interface ApiConnectionStatus {
  adzuna: ApiConnectionState;
  openSkills: ApiConnectionState;
  adzunaMessage?: string;
  openSkillsMessage?: string;
  lastCheckedAt?: string;
}

export interface ApiConfig {
  adzunaAppId: string;
  adzunaAppKey: string;
  openSkillsBaseUrl: string;
  country: string;
  useDemoMode: boolean;
}

export interface DefaultSearchPreferences {
  keyword: string;
  location: string;
  remoteOnly: boolean;
}

export interface NormalizedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryText: string;
  createdAt?: string;
  createdAtLabel: string;
  description?: string;
  category?: string;
  contractType?: string;
  redirectUrl: string;
  source: "adzuna" | "demo";
}

export interface HiringCompany {
  name: string;
  openRoleCount: number;
}

export interface SearchHistoryItem {
  id: string;
  keyword: string;
  location: string;
  createdAt: string;
}

export interface OpenSkillsSuggestion {
  label: string;
  value: string;
}

export interface OpenSkillsNormalizedTitle {
  original: string;
  normalized: string;
  confidence?: number;
}

export interface OpenSkillsRelatedRole {
  title: string;
  score?: number;
}
