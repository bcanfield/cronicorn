import type { insertApiKeysSchema } from "@tasks-app/api/schema";

import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { CodeBlock } from "@/web/components/code-block";
import { useConfirmationDialog } from "@/web/components/confirmation-dialog/use-confirmation-dialog";
import PageHeader from "@/web/components/re-usables/page-header";
import { useDialog } from "@/web/components/simple-dialog/use-dialog";
import { createApiKey, queryKeys } from "@/web/lib/queries/api-keys.queries";
import queryClient from "@/web/lib/query-client";
import ApiKeyForm from "@/web/routes/~dashboard/~api-keys/components/form";

export const Route = createFileRoute("/dashboard/api-keys/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { showDialog } = useDialog();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (data: insertApiKeysSchema) => createApiKey(data),
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.LIST_API_KEYS() });
      await navigate({ to: "/dashboard/api-keys", params: { apiKeyId: data.id } });
      // Show the secret in a dialog
      showDialog({ content: (
        <div className="space-y-6">
          <p>This is the only time you'll see the secret. Copy it now and store it securely — if you lose it, you’ll have to regenerate a new one.</p>
          <CodeBlock code={data.secret} />
        </div>
      ), title: "API Key Created" });
      // Navigate to the API key detail page
    //   navigate({ to: "/dashboard/api-keys/$apiKeyId", params: { apiKeyId: data.id } });
    },
  });

  return (
    <>
      <PageHeader
        title="Create API Key"
        description="Create a new API key for accessing the API"
      />
      <div className="max-w-2xl">
        <ApiKeyForm
          onSubmit={async (data) => {
            await mutateAsync(data as insertApiKeysSchema);
          }}
          isLoading={isPending}
        />
      </div>
    </>
  );
}
