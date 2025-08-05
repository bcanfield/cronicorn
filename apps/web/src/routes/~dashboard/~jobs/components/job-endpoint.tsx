import type { selectEndpointsSchema } from "@tasks-app/api/schema";

import { Link } from "@tanstack/react-router";
import { Edit, Globe } from "lucide-react";

import { formatDate } from "@/web/lib/date-formatter";
import { Badge } from "@workspace/ui/components/badge";
import { buttonVariants } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

export default function Endpoint({ endpoint }: { endpoint: selectEndpointsSchema }) {
  const { id, name, url, method, fireAndForget, createdAt, jobId, timeoutMs } = endpoint;

  return (
    <Card className="w-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="size-4" />
            <span>{name}</span>
          </div>
          <Badge variant={method === "GET" ? "default" : method === "POST" ? "secondary" : "outline"}>
            {method}
          </Badge>
        </CardTitle>
        <CardDescription>
          <span className="developer-ui text-muted-foreground">
            #
            {id.slice(0, 8)}
            {" "}
            • Created
            {" "}
            {formatDate(createdAt)}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid gap-1">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">URL:</span>
            <span className="text-sm truncate max-w-[300px]">{url}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>Timeout:</span>
              <span>
                {timeoutMs}
                ms
              </span>
            </div>
            {fireAndForget && (
              <Badge variant="outline" className="text-xs">
                Fire and Forget
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Link
          to="/dashboard/jobs/$jobId/endpoints/$endpointId"
          params={{ jobId, endpointId: id }}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Edit className="size-4 mr-1" />
          Edit
        </Link>
      </CardFooter>
    </Card>
  );
}
