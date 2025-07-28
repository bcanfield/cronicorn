import type { PaginationChange, SortChange, SortingContainerProps } from "./types";

import { PaginationControls } from "./pagination-controls";
import { SortControls } from "./sort-controls";

// Shared SortingContainerProps imported above

export function SortingContainer<
  K extends string,
  P extends { page?: number; pageSize?: number; sortBy?: K; sortDirection?: "asc" | "desc" },
>({ params, onChange, sortKeys, children, hasNext }: SortingContainerProps<K, P>) {
  const handleSortChange = (change: SortChange<K>) => onChange({ ...params, ...change } as P);
  const handlePageChange = (change: PaginationChange) => onChange({ ...params, ...change } as P);

  return (
    <div>
      <SortControls
        sortKeys={sortKeys}
        sortBy={params.sortBy}
        sortDirection={params.sortDirection}
        onChange={handleSortChange}
      />
      <PaginationControls
        page={params.page}
        pageSize={params.pageSize}
        hasNext={hasNext}
        onChange={handlePageChange}
      />
      {children}
    </div>
  );
}
