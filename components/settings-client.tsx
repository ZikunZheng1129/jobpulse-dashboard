"use client";

import { useEffect, useState } from "react";

import { ConnectionBadge } from "@/components/connection-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DEFAULT_API_CONFIG, DEFAULT_PREFERENCES } from "@/lib/constants";
import { testAdzunaConnection, testOpenSkillsConnection } from "@/lib/api-client";
import {
  clearApiConfig,
  getApiConfig,
  getConnectionStatus,
  getPreferences,
  saveApiConfig,
  saveConnectionStatus,
  savePreferences,
} from "@/lib/storage";
import type { ApiConfig, ApiConnectionStatus, DefaultSearchPreferences } from "@/lib/types";

export function SettingsClient() {
  const [config, setConfig] = useState<ApiConfig>(DEFAULT_API_CONFIG);
  const [preferences, setPreferences] = useState<DefaultSearchPreferences>(DEFAULT_PREFERENCES);
  const [status, setStatus] = useState<ApiConnectionStatus>({ adzuna: "idle", openSkills: "idle" });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setConfig(getApiConfig());
      setStatus(getConnectionStatus());
      setPreferences(getPreferences());
      setInitialized(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const saveAll = () => {
    saveApiConfig(config);
    savePreferences(preferences);
  };

  const resetAll = () => {
    clearApiConfig();
    setConfig(DEFAULT_API_CONFIG);
    setStatus({ adzuna: "idle", openSkills: "idle" });
    saveConnectionStatus({ adzuna: "idle", openSkills: "idle" });
  };

  const testAdzuna = async () => {
    setStatus((current) => ({ ...current, adzuna: "testing" }));
    const result = await testAdzunaConnection(config);

    setStatus((current) => {
      const next: ApiConnectionStatus = {
        ...current,
        adzuna: result.ok ? "connected" : "error",
        adzunaMessage: result.message,
        lastCheckedAt: new Date().toISOString(),
      };
      saveConnectionStatus(next);
      return next;
    });
  };

  const testOpenSkills = async () => {
    setStatus((current) => ({ ...current, openSkills: "testing" }));
    const result = await testOpenSkillsConnection(config);

    setStatus((current) => {
      const next: ApiConnectionStatus = {
        ...current,
        openSkills: result.ok ? "connected" : "error",
        openSkillsMessage: result.message,
        lastCheckedAt: new Date().toISOString(),
      };
      saveConnectionStatus(next);
      return next;
    });
  };

  if (!initialized) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading Settings</CardTitle>
            <CardDescription>Loading saved API and preference values.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Setup</CardTitle>
          <CardDescription>
            Add credentials here instead of editing `.env`. For this MVP, values are stored in
            browser localStorage for local use.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Adzuna App ID</label>
            <Input
              value={config.adzunaAppId}
              onChange={(event) =>
                setConfig((current) => ({ ...current, adzunaAppId: event.target.value }))
              }
              placeholder="Your Adzuna App ID"
            />
            <p className="text-xs text-neutral-500">
              Required for live jobs and hiring metrics.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Adzuna App Key</label>
            <Input
              type="password"
              value={config.adzunaAppKey}
              onChange={(event) =>
                setConfig((current) => ({ ...current, adzunaAppKey: event.target.value }))
              }
              placeholder="Your Adzuna App Key"
            />
            <p className="text-xs text-neutral-500">
              Keep this private. JobPulse sends credentials to server routes at request time.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Open Skills Base URL (Optional)</label>
            <Input
              value={config.openSkillsBaseUrl}
              onChange={(event) =>
                setConfig((current) => ({ ...current, openSkillsBaseUrl: event.target.value }))
              }
              placeholder="https://..."
            />
            <p className="text-xs text-neutral-500">
              Used for title autocomplete, normalization, and related roles.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Adzuna country code</label>
              <Input
                value={config.country}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    country: event.target.value.toLowerCase().trim(),
                  }))
                }
                placeholder="us"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Demo mode</label>
              <Select
                value={config.useDemoMode ? "on" : "off"}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    useDemoMode: event.target.value === "on",
                  }))
                }
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={saveAll}>Save Configuration</Button>
            <Button onClick={testAdzuna} variant="secondary">
              Test Adzuna
            </Button>
            <Button onClick={testOpenSkills} variant="secondary">
              Test Open Skills
            </Button>
            <Button onClick={resetAll} variant="outline">
              Clear / Reset
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-neutral-200 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium">Adzuna</p>
                <ConnectionBadge state={status.adzuna} />
              </div>
              <p className="text-xs text-neutral-500">{status.adzunaMessage ?? "No test yet"}</p>
            </div>

            <div className="rounded-md border border-neutral-200 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium">Open Skills</p>
                <ConnectionBadge state={status.openSkills} />
              </div>
              <p className="text-xs text-neutral-500">
                {status.openSkillsMessage ?? "No test yet"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Search Preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Input
            value={preferences.keyword}
            onChange={(event) =>
              setPreferences((current) => ({ ...current, keyword: event.target.value }))
            }
            placeholder="Default keyword"
          />
          <Input
            value={preferences.location}
            onChange={(event) =>
              setPreferences((current) => ({ ...current, location: event.target.value }))
            }
            placeholder="Default location"
          />
          <Select
            value={preferences.remoteOnly ? "remote" : "all"}
            onChange={(event) =>
              setPreferences((current) => ({
                ...current,
                remoteOnly: event.target.value === "remote",
              }))
            }
          >
            <option value="all">All jobs</option>
            <option value="remote">Remote first</option>
          </Select>
          <Button className="sm:col-span-3" onClick={saveAll}>
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Limitations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-neutral-600">
          <p>
            Company ranking in JobPulse is based on hiring activity (open role count / posting
            frequency), not company size.
          </p>
          <p>
            Missing salary fields are expected in many listings and are displayed as &quot;Salary
            not listed&quot;.
          </p>
          <p>
            This MVP stores API settings in the browser. Production apps should use secure backend
            storage.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
