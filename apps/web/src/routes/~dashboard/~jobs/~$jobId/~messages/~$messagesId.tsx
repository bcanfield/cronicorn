import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { insertMessagesSchema } from "@tasks-app/api/schema";

import { useConfirmationDialog } from "@/web/components/confirmation-dialog/use-confirmation-dialog";
import PageHeader from "@/web/components/re-usables/page-header";
import { createMessageQueryOptions, deleteMessage, queryKeys, updateMessage } from "@/web/lib/queries/messages.queries";
import queryClient from "@/web/lib/query-client";
import MessageForm from "@/web/routes/~dashboard/~jobs/~$jobId/~messages/components/form";

export const Route = createFileRoute(
  "/dashboard/jobs/$jobId/messages/$messagesId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { jobId, messagesId } = Route.useParams();
  // Get Message data
  const { data: message } = useSuspenseQuery(createMessageQueryOptions(messagesId));

  const { confirm } = useConfirmationDialog();

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateMessage,
    onSuccess: () => {
      // Invalidate the messages list
      queryClient.invalidateQueries({
        queryKey: queryKeys.LIST_MESSAGES(),
      });
      // Invalidate the specific message
      queryClient.invalidateQueries({
        queryKey: queryKeys.LIST_MESSAGE(messagesId).queryKey,
      });
      // Navigate back to messages list
      navigate({ to: "/dashboard/jobs/$jobId/messages", params: { jobId } });
    },
  });

  // Delete mutation
  const { mutateAsync: deleteMutate } = useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => {
      // Invalidate messages list
      queryClient.invalidateQueries({ queryKey: queryKeys.LIST_MESSAGES() });
      // Also invalidate the specific message (though it's deleted)
      queryClient.invalidateQueries({ queryKey: queryKeys.LIST_MESSAGE(messagesId).queryKey });
      navigate({ to: "/dashboard/jobs/$jobId/messages", params: { jobId } });
    },
  });

  const handleCancel = () => navigate({ to: "/dashboard/jobs/$jobId/messages", params: { jobId } });

  const handleSubmit = async (data: insertMessagesSchema) => {
    await updateMutation.mutateAsync({
      id: messagesId,
      message: data,
    });
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Message",
      description: "Are you sure you want to delete this Message? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
    });

    if (confirmed) {
      deleteMutate(messagesId);
    }
  };

  // Since we are only allowing editing of messages with role 'user', we can check that here
  const { success, data } = insertMessagesSchema.safeParse(message);

  return (
    <>
      <PageHeader title="Edit Message" description={`Message: ${message.id}`} />

      {success
        ? (
            <MessageForm
              defaultValues={data}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              mode="update"
              onDelete={handleDelete}
            />
          )
        : (

            <p>Messages with role other than 'user' are currently not editable</p>
          )}

    </>
  );
}
