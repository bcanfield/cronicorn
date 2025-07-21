import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import RoutePending from "@/web/components/route-pending";
import dateFormatter from "@/web/lib/date-formatter";
import { createTaskQueryOptions } from "@/web/lib/queries";
import queryClient from "@/web/lib/query-client";

export const Route = createFileRoute("/task/$id/")({
  loader: ({ params }) =>
    queryClient.ensureQueryData(createTaskQueryOptions(params.id)),
  component: RouteComponent,
  pendingComponent: RoutePending,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(createTaskQueryOptions(id));

  return (
    <article>
      <h2>{data.name}</h2>
      <h4>
        Done:
        {" "}
        {data.done ? "✅" : "❌"}
      </h4>
      <hr />
      <small>
        Updated:
        {" "}
        {dateFormatter.format(new Date(data.updatedAt))}
      </small>
      <br />
      <small>
        Created:
        {" "}
        {dateFormatter.format(new Date(data.createdAt))}
      </small>
      <div className="buttons">
        <Link
          role="button"
          to="/task/$id/edit"
          params={{ id }}
          className="contrast outline"
        >
          Edit
        </Link>
      </div>
    </article>
  );
}
