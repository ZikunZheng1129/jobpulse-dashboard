# JobPulse

JobPulse is a small Next.js dashboard for reading job-market signals from live APIs.
It focuses on hiring activity, salary coverage, and role/skill patterns.

## What it does

- Fetches live jobs from Adzuna
- Adds title/role enrichment from Open Skills
- Shows a compact dashboard, jobs explorer, and chart-based insights
- Lets you configure API credentials in the UI (`/settings`)

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- TanStack Table

## API dependencies

- Adzuna API
- Open Skills API (optional but recommended)

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## API setup (UI first)

1. Go to `/settings`
2. Enter:
   - Adzuna App ID
   - Adzuna App Key
   - Open Skills Base URL (optional)
3. Save config
4. Use the test buttons to verify connections

For this MVP, config is saved in browser `localStorage`.

## Optional `.env` fallback

If you prefer env-based fallback:

```bash
cp .env.example .env.local
```

Then set values in `.env.local`.

### Environment variables

- `ADZUNA_APP_ID`
- `ADZUNA_APP_KEY`
- `ADZUNA_COUNTRY` (default: `us`)
- `OPEN_SKILLS_BASE_URL`

Request-time config from Settings is used first; env vars are fallback.

## Notes and limitations

- Company size is not reliably available in these public APIs.
  - Company ranking uses **hiring activity** (open roles/posting frequency), not size.
- Salary/location charts depend on API coverage.
  - Some postings have missing salary or coarse location fields.
- Salary-by-company and salary-by-location charts apply minimum thresholds to avoid noisy output.

## Project layout

```text
app/
  api/
  insights/
  jobs/
  settings/
  layout.tsx
  page.tsx
components/
  *-client.tsx
  ui/
lib/
  api-client.ts
  constants.ts
  storage.ts
  normalizers.ts
  ...
```


## Quick checks before push

```bash
npm run lint
npm run build
```
