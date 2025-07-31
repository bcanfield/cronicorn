import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

import { createMessage } from "@/web/lib/queries/messages.queries";
import queryClient from "@/web/lib/query-client";
import MessageForm from "@/web/routes/~dashboard/~jobs/~$jobId/~messages/components/form";
import { Button } from "@workspace/ui/components/button";

export const Route = createFileRoute("/dashboard/jobs/$jobId/messages/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();

  const { mutateAsync } = useMutation({
    mutationFn: createMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-messages"] });
      navigate({ to: "/dashboard/jobs/$jobId/messages" });
    },
  });

  const handleBack = () => {
    navigate({ to: "/dashboard/jobs/$jobId/messages" });
  };

  const handleSubmit = async (data: Parameters<typeof createMessage>[0]) => {
    await mutateAsync(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleBack}>
          <ChevronLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Create Message</h1>
          <p className="text-muted-foreground">Add a new message</p>
        </div>
      </div>

      <MessageForm
        onSubmit={handleSubmit}
        onCancel={handleBack}
        mode="create"
      />
    </div>
  );
}
