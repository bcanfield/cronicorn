import type { selectMessagesSchema } from "@tasks-app/api/schema";

import { Link } from "@tanstack/react-router";
import { Trash } from "lucide-react";

import { formatDate } from "@/web/lib/date-formatter";
import { deleteMessage } from "@/web/lib/queries/messages.queries";
import queryClient from "@/web/lib/query-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
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
  const formattedContent = typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.map((part, idx) => {
        // Create unique keys that don't rely solely on index
          const uniqueId = `${id.substring(0, 8)}-${idx}`;

          if ("text" in part) {
            return <p key={`text-${uniqueId}`}>{part.text}</p>;
          }
          else if ("type" in part && part.type === "reasoning") {
            return <p key={`reasoning-${uniqueId}`} className="text-secondary-foreground">{part.text}</p>;
          }
          return (
            <p key={`other-${uniqueId}`}>
              [Content type:
              {(part).type}
              ]
            </p>
          );
        })
      : <p>[Unsupported content format]</p>;

  const handleDelete = async () => {
    await deleteMessage(id);
    queryClient.invalidateQueries({ queryKey: ["list-messages"] });
  };

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
          <div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Trash className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the message.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
      <CardContent>
        <div className="space-y-2">
          {formattedContent}
        </div>
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
