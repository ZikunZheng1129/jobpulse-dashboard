import type {
  HiringCompany,
  NormalizedJob,
  OpenSkillsNormalizedTitle,
  OpenSkillsRelatedRole,
  OpenSkillsSuggestion,
} from "@/lib/types";
import { salaryText } from "@/lib/utils";

type GenericRecord = Record<string, unknown>;

function asRecord(value: unknown): GenericRecord {
  return typeof value === "object" && value !== null ? (value as GenericRecord) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toNumberValue(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function relativeDateLabel(dateString?: string): string {
  if (!dateString) return "Unknown";
  const target = new Date(dateString).getTime();
  if (Number.isNaN(target)) return "Unknown";

  const days = Math.max(0, Math.floor((Date.now() - target) / 86400000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function normalizeAdzunaJob(rawJob: unknown): NormalizedJob {
  const job = asRecord(rawJob);
  const company = asRecord(job.company);
  const location = asRecord(job.location);
  const category = asRecord(job.category);
  const area = asArray(location.area);
  const salaryMin = toNumberValue(job.salary_min) ?? null;
  const salaryMax = toNumberValue(job.salary_max) ?? null;
  const createdAt = toStringValue(job.created) || undefined;
  const area1 = toStringValue(area[1]);
  const area2 = toStringValue(area[2]);
  const fallbackLocation = [area1, area2].filter(Boolean).join(", ");

  return {
    id: String(job.id ?? `${toStringValue(job.redirect_url)}-${toStringValue(job.title)}`),
    title: toStringValue(job.title, "Untitled role"),
    company: toStringValue(company.display_name, "Unknown company"),
    location:
      toStringValue(location.display_name) ||
      fallbackLocation ||
      "Unknown location",
    salaryMin,
    salaryMax,
    salaryText: salaryText(salaryMin, salaryMax),
    createdAt,
    createdAtLabel: relativeDateLabel(createdAt),
    description: toStringValue(job.description) || undefined,
    category: toStringValue(category.label) || undefined,
    contractType: toStringValue(job.contract_type) || undefined,
    redirectUrl: toStringValue(job.redirect_url, "#"),
    source: "adzuna",
  };
}

export function aggregateHiringCompanies(jobs: NormalizedJob[]): HiringCompany[] {
  const map = new Map<string, number>();

  for (const job of jobs) {
    map.set(job.company, (map.get(job.company) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([name, openRoleCount]) => ({ name, openRoleCount }))
    .sort((a, b) => b.openRoleCount - a.openRoleCount)
    .slice(0, 8);
}

export function normalizeOpenSkillsSuggestions(payload: unknown): OpenSkillsSuggestion[] {
  const objectPayload = asRecord(payload);
  const items = Array.isArray(objectPayload.results)
    ? objectPayload.results
    : Array.isArray(payload)
      ? payload
      : [];

  return items.slice(0, 12).map((item) => {
    const row = asRecord(item);
    return {
      label: toStringValue(row.label) || toStringValue(row.title) || toStringValue(row.name),
      value: toStringValue(row.value) || toStringValue(row.title) || toStringValue(row.name),
    };
  });
}

export function normalizeOpenSkillsTitle(payload: unknown): OpenSkillsNormalizedTitle[] {
  const objectPayload = asRecord(payload);
  const items = Array.isArray(objectPayload.results)
    ? objectPayload.results
    : Array.isArray(payload)
      ? payload
      : [];

  return items.slice(0, 10).map((item) => {
    const row = asRecord(item);
    return {
      original: toStringValue(row.original) || toStringValue(row.query),
      normalized:
        toStringValue(row.normalized) || toStringValue(row.title) || toStringValue(row.name),
      confidence: toNumberValue(row.confidence) ?? toNumberValue(row.score),
    };
  });
}

export function normalizeOpenSkillsRelated(payload: unknown): OpenSkillsRelatedRole[] {
  const objectPayload = asRecord(payload);
  const items = Array.isArray(objectPayload.results)
    ? objectPayload.results
    : Array.isArray(payload)
      ? payload
      : [];

  return items.slice(0, 10).map((item) => {
    const row = asRecord(item);
    return {
      title: toStringValue(row.title) || toStringValue(row.name) || toStringValue(row.label),
      score: toNumberValue(row.score),
    };
  });
}
