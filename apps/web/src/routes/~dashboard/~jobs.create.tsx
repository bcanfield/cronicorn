import { createFileRoute } from "@tanstack/react-router";

import JobForm from "@/web/routes/~dashboard/components/form";

export const Route = createFileRoute("/dashboard/jobs/create")({
  component: RouteComponent,
});

function RouteComponent() {
  return <JobForm />;
}
