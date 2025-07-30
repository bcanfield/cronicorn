import type { selectJobsSchema } from "@tasks-app/api/schema";

import Job from "./job";

export default function JobList({ jobs }: { jobs: selectJobsSchema[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 ">
      {jobs.map(job => (
        <Job job={job} key={job.id} />
      ))}
    </div>
  );
}
