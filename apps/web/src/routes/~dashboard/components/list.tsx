import { getRouteApi } from "@tanstack/react-router";
import { JOB_SORT_KEYS, type listJobsSchema, type selectJobsSchema } from "@tasks-app/api/schema";

import { SortingContainer } from "@/web/features/sorting/SortingContainer";

import Job from "./job";

const routeApi = getRouteApi("/dashboard/");

export default function JobList({ params, jobs }: { params: listJobsSchema; jobs: selectJobsSchema[] }) {
  const navigate = routeApi.useNavigate();
  const setParams = (newParams: listJobsSchema) => {
    // const updatedParams: ListJobsQuery = { ...params, ...newParams };
    navigate({ search: newParams });
  };

  return (
    <>
      <SortingContainer onChange={setParams} params={params} sortKeys={JOB_SORT_KEYS} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map(job => (
          <Job job={job} key={job.id} />
        ))}
      </div>
    </>
  );
}
