import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { listMessagesSchema, MESSAGE_SORT_KEYS } from "@tasks-app/api/schema";
import { PlusCircle } from "lucide-react";

import PageHeader from "@/web/components/re-usables/page-header";
import RoutePending from "@/web/components/route-pending";
import { SortingContainer } from "@/web/features/sorting/sorting-container";
import { createJobQueryOptions } from "@/web/lib/queries/jobs.queries";
import { messagesQueryOptions } from "@/web/lib/queries/messages.queries";
import queryClient from "@/web/lib/query-client";
import MessageList from "@/web/routes/~dashboard/~jobs/~$jobId/~messages/components/list";
import { buttonVariants } from "@workspace/ui/components/button";

export const Route = createFileRoute("/dashboard/jobs/$jobId/messages/")({
  component: RouteComponent,
  pendingComponent: RoutePending,
  validateSearch: listMessagesSchema,
  loaderDeps: ({ search }) => listMessagesSchema.parse(search),

  loader: async ({ deps, params }) => {
    return Promise.all([
      queryClient.ensureQueryData(createJobQueryOptions(params.jobId)),
      queryClient.ensureQueryData(messagesQueryOptions(deps)),
    ]);
  },
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const { jobId } = Route.useParams();
  const { data: job } = useSuspenseQuery(createJobQueryOptions(jobId));
  const { data: { items, hasNext } } = useSuspenseQuery(messagesQueryOptions(params));
  const setParams = (newParams: listMessagesSchema) => {
    navigate({ search: newParams });
  };
  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="Job Messages" description={`Job: ${job.id}`} />
        <Link
          to="/dashboard/jobs/$jobId/messages/create"
          params={{ jobId }}
          className={buttonVariants()}
        >
          <PlusCircle className="size-4" />
          Create Message
        </Link>

      </div>
      <SortingContainer
        hasNext={hasNext}
        onChange={setParams}
        params={params}
        sortKeys={MESSAGE_SORT_KEYS}
      >
        <MessageList messages={items} />
      </SortingContainer>
    </>

  );
}
