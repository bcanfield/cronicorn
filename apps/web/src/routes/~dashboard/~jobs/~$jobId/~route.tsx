import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";

export const Route = createFileRoute("/dashboard/jobs/$jobId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { pathname } = useLocation();
  const isMessagesPath = pathname.includes("/messages");
  const isContextPath = pathname.includes("/context");

  // We only show the breadcrumbs for messages or context sub-routes
  const showBreadcrumbs = isMessagesPath || isContextPath;

  return (
    <>
      {showBreadcrumbs && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/dashboard/jobs">Jobs</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{isMessagesPath ? "Messages" : "Context"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <Outlet />
    </>
  );
}
