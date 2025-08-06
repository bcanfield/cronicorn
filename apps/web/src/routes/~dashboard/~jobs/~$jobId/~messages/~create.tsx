import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import PageHeader from "@/web/components/re-usables/page-header";
import { createMessage } from "@/web/lib/queries/messages.queries";
import queryClient from "@/web/lib/query-client";
import MessageForm from "@/web/routes/~dashboard/~jobs/~$jobId/~messages/components/form";

export const Route = createFileRoute("/dashboard/jobs/$jobId/messages/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { jobId } = Route.useParams();

  const { mutateAsync } = useMutation({
    mutationFn: createMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-messages"] });
      navigate({ to: "/dashboard/jobs/$jobId/messages" });
    },
  });

  const handleBack = () => {
    navigate({ to: "/dashboard/jobs/$jobId/messages", params: { jobId } });
  };

  const handleSubmit = async (data: Parameters<typeof createMessage>[0]) => {
    await mutateAsync(data);
  };

  return (
    <>
      <PageHeader title="Create Message" description="Add a new message" />
      <MessageForm
        onSubmit={handleSubmit}
        onCancel={handleBack}
        mode="create"
      />
    </>
  );
}
