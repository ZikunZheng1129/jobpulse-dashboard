import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SetupRequiredCard() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle>Set up APIs to unlock live data</CardTitle>
        <CardDescription>
          Add your Adzuna credentials (and optional Open Skills URL) in Settings.
          Demo mode is available if you want to try the UI first.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-3 sm:flex-row">
        <Link href="/settings">
          <Button>Open API Setup</Button>
        </Link>
        <p className="text-xs text-neutral-500">
          Credentials are stored in your browser localStorage for local personal use only.
        </p>
      </CardContent>
    </Card>
  );
}
