import { Badge } from "@/components/ui/badge";
import type { ApiConnectionState } from "@/lib/types";

export function ConnectionBadge({ state }: { state: ApiConnectionState }) {
  if (state === "connected") return <Badge variant="success">Connected</Badge>;
  if (state === "error") return <Badge variant="error">Not connected</Badge>;
  if (state === "testing") return <Badge variant="outline">Testing...</Badge>;
  return <Badge variant="outline">Not tested</Badge>;
}
