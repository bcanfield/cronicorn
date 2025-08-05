import type { selectEndpointsSchema } from "@tasks-app/api/schema";

import Endpoint from "./job-endpoint";

export default function EndpointList({ endpoints }: { endpoints: selectEndpointsSchema[] }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {endpoints.length === 0
        ? (
            <p className="text-muted-foreground text-center py-8">No endpoints found</p>
          )
        : (
            endpoints.map(endpoint => (
              <Endpoint endpoint={endpoint} key={endpoint.id} />
            ))
          )}
    </div>
  );
}
