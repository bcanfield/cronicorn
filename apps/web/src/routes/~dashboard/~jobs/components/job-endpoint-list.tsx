import type { selectEndpointsSchema } from "@tasks-app/api/schema";

import { Target } from "lucide-react";

import EmptyPlaceholder from "@/web/components/empty-placeholder";

import Endpoint from "./job-endpoint";

export default function EndpointList({ endpoints }: { endpoints: selectEndpointsSchema[] }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {endpoints.length === 0
        ? (
            <EmptyPlaceholder icon={<Target />} title="No Endpoints found" description="You don't have any Endpoints yet. Create your first Endpoint to get started." />)
        : (
            endpoints.map(endpoint => (
              <Endpoint endpoint={endpoint} key={endpoint.id} />
            ))
          )}
    </div>
  );
}
