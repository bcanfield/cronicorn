import { createFileRoute } from "@tanstack/react-router";

import PageHeader from "@/web/components/re-usables/page-header";
import JobForm from "@/web/routes/~dashboard/~jobs/components/form";

export const Route = createFileRoute("/dashboard/jobs/create")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>

      <PageHeader title="Create New Job" description="Configure a new job" />

      <JobForm />
    </>
  );
}
