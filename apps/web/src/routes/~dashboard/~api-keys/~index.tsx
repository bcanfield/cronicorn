import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { API_KEY_SORT_KEYS, listApiKeysSchema } from "@tasks-app/api/schema";
import { PlusCircle } from "lucide-react";

import { useConfirmationDialog } from "@/web/components/confirmation-dialog/use-confirmation-dialog";
import PageHeader from "@/web/components/re-usables/page-header";
import RoutePending from "@/web/components/route-pending";
import { SortingContainer } from "@/web/features/sorting/sorting-container";
import { apiKeysQueryOptions, deleteApiKey, queryKeys } from "@/web/lib/queries/api-keys.queries";
import queryClient from "@/web/lib/query-client";
import ApiKeyList from "@/web/routes/~dashboard/~api-keys/components/list";
import { buttonVariants } from "@workspace/ui/components/button";

export const Route = createFileRoute("/dashboard/api-keys/")({
  component: RouteComponent,
  validateSearch: listApiKeysSchema,

  pendingComponent: RoutePending,
  loaderDeps: ({ search }) => listApiKeysSchema.parse(search),
  loader: ({ deps }) =>
    queryClient.ensureQueryData(apiKeysQueryOptions(deps)),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: { items, hasNext } } = useSuspenseQuery(apiKeysQueryOptions(params));
  const { mutateAsync: deleteMutate } = useMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.LIST_API_KEYS() });
      navigate({ to: "/dashboard/api-keys" });
    },
  });

  const setParams = (newParams: listApiKeysSchema) => {
    navigate({ search: newParams });
  };
  const { confirm } = useConfirmationDialog();

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete API Key",
      description: "Are you sure you want to delete this API key? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
    });

    if (confirmed) {
      deleteMutate(id);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="API Keys" description="Manage your API keys" />
        <Link
          to="/dashboard/api-keys/create"
          className={buttonVariants()}
        >
          <PlusCircle className="size-4" />
          Create API Key
        </Link>

      </div>
      <SortingContainer
        hasNext={hasNext}
        onChange={setParams}
        params={params}
        sortKeys={API_KEY_SORT_KEYS}
      >
        <ApiKeyList apiKeys={items} onDelete={handleDelete} />

      </SortingContainer>
    </>
  );
}
