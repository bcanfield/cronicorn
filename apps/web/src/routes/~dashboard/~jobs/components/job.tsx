import type { selectJobsSchema } from "@tasks-app/api/schema";

import { Link } from "@tanstack/react-router";
import { Activity, Calendar, Edit, Globe, Lock, MessageSquare, User } from "lucide-react";

import { formatDate } from "@/web/lib/date-formatter";
import { Badge } from "@workspace/ui/components/badge";
import { buttonVariants } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";

export default function Job({ job }: { job: selectJobsSchema }) {
  const totalTokensUsed = job.inputTokens + job.outputTokens + job.reasoningTokens;

  return (
    <Card className="w-full hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="developer-ui text-muted-foreground">
                    #
                    {job.id.slice(0, 8)}
                  </span>
                  {job.locked && <Lock className="w-4 h-4 text-muted-foreground" />}
                  {job.userId && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span className="developer-ui text-xs">{job.userId.slice(0, 8)}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={job.status === "ACTIVE" ? "success" : job.status === "PAUSED" ? "warning" : "default"}>
                    {job.status.toLowerCase()}
                  </Badge>
                  {/* <span className={getStatusBadgeClass(job.status)}>{job.status.toLowerCase()}</span> */}
                </div>
              </div>
              <div className="flex gap-2">
                <Link to="/dashboard/jobs/$jobId" params={{ jobId: job.id }} className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0 flex gap-2 items-center" })}>
                  <Edit className="size-4" />
                  Edit
                </Link>
                <Link to="/dashboard/jobs/$jobId/messages" params={{ jobId: job.id }} className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0 flex gap-2 items-center" })}>
                  <MessageSquare className="size-4" />
                  Messages
                </Link>
                <Link to="/dashboard/jobs/$jobId/endpoints" params={{ jobId: job.id }} className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0 flex gap-2 items-center" })}>
                  <Globe className="size-4" />
                  Endpoints
                </Link>
              </div>

            </div>

            {/* Job Definition */}
            <div className="space-y-2">
              <p className="text-sm text-foreground leading-relaxed">{job.definitionNL}</p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Dates */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs font-medium">Created</span>
                </div>
                <p className="text-xs developer-ui">{formatDate(job.createdAt)}</p>
              </div>

              {job.nextRunAt && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span className="text-xs font-medium">Next Run</span>
                  </div>
                  <p className="text-xs developer-ui">{formatDate(job.nextRunAt)}</p>
                </div>
              )}

              {/* Token Usage */}
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Activity className="w-3 h-3" />
                  <span className="text-xs font-medium">Total Tokens</span>
                </div>
                <p className="text-xs developer-ui font-medium">{job.totalTokens.toLocaleString()}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Activity className="w-3 h-3" />
                  <span className="text-xs font-medium">Used Tokens</span>
                </div>
                <p className="text-xs developer-ui font-medium">{totalTokensUsed.toLocaleString()}</p>
              </div>
            </div>

            {/* Token Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="metric-card">
                <div className="text-xs text-muted-foreground">Input</div>
                <div className="text-sm font-medium developer-ui">{job.inputTokens.toLocaleString()}</div>
              </div>
              <div className="metric-card">
                <div className="text-xs text-muted-foreground">Output</div>
                <div className="text-sm font-medium developer-ui">{job.outputTokens.toLocaleString()}</div>
              </div>
              <div className="metric-card">
                <div className="text-xs text-muted-foreground">Reasoning</div>
                <div className="text-sm font-medium developer-ui">{job.reasoningTokens.toLocaleString()}</div>
              </div>
              <div className="metric-card">
                <div className="text-xs text-muted-foreground">Cached</div>
                <div className="text-sm font-medium developer-ui">{job.cachedInputTokens.toLocaleString()}</div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-xs text-muted-foreground font-mono space-x-2">
              <span>
                Last updated
              </span>
              <span>
                {formatDate(job.updatedAt)}

              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
