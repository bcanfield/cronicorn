import type { selectJobsSchema } from "@tasks-app/api/schema";

import { Link } from "@tanstack/react-router";

import dateFormatter from "@/web/lib/date-formatter";

export default function Job({ job }: { job: selectJobsSchema }) {
  return (
    <article>
      <h3>{job.definitionNL}</h3>
      <h4>
        Status:
        {job.status}
      </h4>
      <h4>
        Next Run:
        {" "}
        {job.nextRunAt ? dateFormatter.format(new Date(job.nextRunAt)) : "N/A"}
      </h4>
      <hr />
      <small>
        Updated:
        {" "}
        {dateFormatter.format(new Date(job.updatedAt))}
      </small>
      <br />
      <small>
        Created:
        {" "}
        {dateFormatter.format(new Date(job.createdAt))}
      </small>
      <div className="buttons">
        <Link
          to="/jobs/$id"
          params={{ id: job.id }}
          role="button"
          className="outline"
        >
          View
        </Link>
      </div>
    </article>
  );
}
