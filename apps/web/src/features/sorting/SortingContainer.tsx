import type { ListJobsQuery } from "@tasks-app/api/schema";

import { getRouteApi } from "@tanstack/react-router";

import { FilterControls } from "./filter-controls";
import { PaginationControls } from "./pagination-controls";
import { SortControls } from "./sort-controls";

export type JobsSortingContainerProps = {
  params: ListJobsQuery;
};
const routeApi = getRouteApi("/dashboard/");

export function JobsSortingContainer({ params }: JobsSortingContainerProps) {
  const navigate = routeApi.useNavigate();

  const setParams = (newParams: Partial<ListJobsQuery>) => {
    const updatedParams: ListJobsQuery = { ...params, ...newParams };
    navigate({ search: updatedParams });
  };

  return (
    <div>
      <h1 className="mb-4">Sorting container</h1>
      <FilterControls filters={params} onChange={setParams} />
      <SortControls
        sortBy={params.sortBy}
        sortDirection={params.sortDirection}
        onChange={setParams}
      />
      <PaginationControls
        page={params.page}
        pageSize={params.pageSize}
        onChange={setParams}
      />
      <pre>{JSON.stringify(params, null, 2)}</pre>
    </div>
  );
}
