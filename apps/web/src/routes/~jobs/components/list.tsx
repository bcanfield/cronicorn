import type { selectJobsSchema } from "@tasks-app/api/schema";

import Job from "./job";

export default function JobList({ jobs }: { jobs: selectJobsSchema[] }) {
  return (
    <>
      {jobs.map(job => (
        <Job job={job} key={job.id} />
      ))}
    </>
  );
}
