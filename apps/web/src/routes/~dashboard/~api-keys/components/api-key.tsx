import type { selectApiKeysSchema } from "@tasks-app/api/schema";

import { KeyRound, Trash2Icon } from "lucide-react";

import { formatDate } from "@/web/lib/date-formatter";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";

export default function ApiKey({ apiKey, onDelete }: { apiKey: selectApiKeysSchema; onDelete: (id: string) => void }) {
  const isExpired = apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date();
  const isRevoked = apiKey.revoked;

  return (
    <Card className={cn(isRevoked && "opacity-70")}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <KeyRound className="size-5" />
            {apiKey.name}
            {isRevoked && (
              <Badge variant="destructive" className="ml-2">
                Revoked
              </Badge>
            )}
            {isExpired && !isRevoked && (
              <Badge variant="outline" className="ml-2">
                Expired
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {apiKey.description || "No description"}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" size="icon" onClick={() => onDelete?.(apiKey.id)}>
            <Trash2Icon className="size-4" />
            <span className="sr-only">Delete</span>
          </Button>

        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Created</p>
            <p>{formatDate(apiKey.createdAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Last Used</p>
            <p>
              {apiKey.lastUsedAt
                ? formatDate(apiKey.lastUsedAt, "PPP")
                : "Never"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Expires</p>
            <p>{apiKey.expiresAt ? formatDate(apiKey.expiresAt, "PPP") : "Never"}</p>
          </div>

          {apiKey.scopes && apiKey.scopes.length > 0 && (
            <div>
              <p className="text-muted-foreground">Scopes</p>
              <div className="flex flex-wrap gap-1">
                {apiKey.scopes.map(scope => (
                  <Badge key={scope} variant="secondary">
                    {scope}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
