import type { patchApiKeysSchema } from "@tasks-app/api/schema";

import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import PageHeader from "@/web/components/re-usables/page-header";
import RoutePending from "@/web/components/route-pending";
import { createApiKeyQueryOptions, deleteApiKey, queryKeys, updateApiKey } from "@/web/lib/queries/api-keys.queries";
import queryClient from "@/web/lib/query-client";
import ApiKeyForm from "@/web/routes/~dashboard/~api-keys/components/form";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

export const Route = createFileRoute("/dashboard/api-keys/$apiKeyId")({
  component: RouteComponent,
  pendingComponent: RoutePending,
  loader: ({ params }) =>
    queryClient.ensureQueryData(createApiKeyQueryOptions(params.apiKeyId)),
});

function RouteComponent() {
  const params = Route.useParams();
  const navigate = Route.useNavigate();
  const apiKeyId = params.apiKeyId;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch the API key
  const { data: apiKey } = useSuspenseQuery(createApiKeyQueryOptions(apiKeyId));

  // Update mutation
  const { mutateAsync: updateMutate, isPending: isUpdatePending } = useMutation({
    mutationFn: async (data: patchApiKeysSchema) => updateApiKey({ id: apiKeyId, apiKey: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.LIST_API_KEYS() });
      queryClient.invalidateQueries({ queryKey: queryKeys.LIST_API_KEY(apiKeyId).queryKey });
    },
  });

  // Delete mutation
  const { mutateAsync: deleteMutate, isPending: isDeletePending } = useMutation({
    mutationFn: async () => deleteApiKey(apiKeyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.LIST_API_KEYS() });
      navigate({ to: "/dashboard/api-keys" });
    },
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader
          title={`Edit API Key: ${apiKey.name}`}
          description="Update or manage this API key"
        />
        <Button
          variant="destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          Delete API Key
        </Button>
      </div>

      {apiKey.revoked && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>API Key Revoked</AlertTitle>
          <AlertDescription>
            This API key has been revoked and cannot be used for authentication.
          </AlertDescription>
        </Alert>
      )}

      <div className="max-w-2xl">
        <ApiKeyForm
          defaultValues={apiKey}
          onSubmit={async (data) => {
            await updateMutate(data as patchApiKeysSchema);
          }}
          isLoading={isUpdatePending}
        />
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this API key? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await deleteMutate();
              }}
              disabled={isDeletePending}
            >
              {isDeletePending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
