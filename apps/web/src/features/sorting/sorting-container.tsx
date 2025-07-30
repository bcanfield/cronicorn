import type { PaginationChange, SortChange, SortingContainerProps } from "./types";

import { PaginationControls } from "./pagination-controls";
import { SearchControls } from "./search-controls";
import { SortControls } from "./sort-controls";

// Shared SortingContainerProps imported above

export function SortingContainer<
  K extends string,
  P extends { page?: number; pageSize?: number; searchQuery?: string; sortBy?: K; sortDirection?: "asc" | "desc" },
>({ params, onChange, sortKeys, children, hasNext }: SortingContainerProps<K, P>) {
  const handleSearchChange = (change: { searchQuery?: string }) => onChange({ ...params, ...change } as P);
  const handleSortChange = (change: SortChange<K>) => onChange({ ...params, ...change } as P);
  const handlePageChange = (change: PaginationChange) => onChange({ ...params, ...change } as P);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <SortControls
          sortKeys={sortKeys}
          sortBy={params.sortBy}
          sortDirection={params.sortDirection}
          onChange={handleSortChange}
        />
        <SearchControls
          searchQuery={params.searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {children}
      <PaginationControls
        page={params.page}
        pageSize={params.pageSize}
        hasNext={hasNext}
        onChange={handlePageChange}
      />
    </div>
  );
}
