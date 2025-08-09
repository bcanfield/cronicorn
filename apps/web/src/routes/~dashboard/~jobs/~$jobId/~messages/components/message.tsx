import type { selectMessagesSchema } from "@tasks-app/api/schema";

import { Link } from "@tanstack/react-router";
import { Edit } from "lucide-react";
import Markdown from "react-markdown";

import ExpandableText from "@/web/components/expandable-test";
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

export default function Message({ message }: { message: selectMessagesSchema }) {
  const { id, role, content, createdAt, jobId } = message;

  // Format the content for display
  const formattedContent
    = typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content
            .map((part) => {
              if ("text" in part) {
                return part.text;
              }
              else if ("type" in part && part.type === "reasoning") {
                return part.text;
              }
              return `[Content type: ${(part as any).type}]`;
            })
            .join("\n\n")
        : "[Unsupported content format]";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>
              {id.substring(0, 8)}
              ...
            </CardTitle>
            <Badge variant={role === "system"
              ? "default"
              : role === "user"
                ? "secondary"
                : role === "assistant"
                  ? "outline"
                  : "destructive"}
            >
              {role}
            </Badge>
          </div>
          <div className="flex">
            <Link to="/dashboard/jobs/$jobId/messages/$messagesId" params={{ jobId, messagesId: id }} className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0 flex gap-2 items-center" })}>
              <Edit className="size-4" />
              Edit
            </Link>
          </div>
        </div>
        <CardDescription>
          Created
          {" "}
          {formatDate(createdAt)}
          {jobId && (
            <>
              {" "}
              •
              <Link to="/dashboard/jobs/$jobId" params={{ jobId }}>View job</Link>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-xs">
        <ExpandableText clampLines={8} gradientHeight={64}>
          <Markdown>
            {formattedContent}
          </Markdown>

        </ExpandableText>

      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          ID:
          {id}
        </div>
      </CardFooter>
    </Card>
  );
}
