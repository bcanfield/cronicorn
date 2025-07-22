import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import RoutePending from "@/web/components/route-pending";
import { jobsQueryOptions } from "@/web/lib/queries/jobs.queries";
import queryClient from "@/web/lib/query-client";

import JobForm from "./components/form";
import JobList from "./components/list";

export const Route = createFileRoute("/jobs/")({
  loader: () => queryClient.ensureQueryData(jobsQueryOptions),
  component: Index,
  pendingComponent: RoutePending,
});

function Index() {
  const { data } = useSuspenseQuery(jobsQueryOptions);
  return (
    <div>
      <JobForm />
      <JobList jobs={data} />
    </div>
  );
}
