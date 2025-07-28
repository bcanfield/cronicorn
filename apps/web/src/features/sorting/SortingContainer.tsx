// Removed unused SortAndFilterParams

import { SortControls } from "./sort-controls";

/**
 * @template T Tuple of allowed sort keys
 * @template P Parent params type containing optional sortBy and sortDirection fields of type T[number]
 */
/**
 * Props for a generic sorting container.
 * @template T - tuple of allowed sort keys
 * @template P - parent params type that includes optional sortBy and sortDirection of T[number]
 */
export type SortingContainerProps<
  T extends readonly string[],
  P extends { sortBy?: T[number]; sortDirection?: "asc" | "desc" },
> = {
  params: P;
  onChange: (params: P) => void;
  sortKeys: T;
};

export function SortingContainer<
  T extends readonly string[],
  P extends { sortBy?: T[number]; sortDirection?: "asc" | "desc" },
>({ params, onChange, sortKeys }: SortingContainerProps<T, P>) {
  const handleControlsChange = (
    change: Partial<{ sortBy: T[number]; sortDirection?: "asc" | "desc" }>,
  ) => {
    onChange({ ...params, ...change } as P);
  };

  return (
    <div>
      <h1 className="mb-4">Jobs List</h1>
      {/* <FilterControls filters={params} onChange={setParams} /> */}
      <SortControls
        sortKeys={sortKeys}
        sortBy={params.sortBy}
        sortDirection={params.sortDirection}
        onChange={handleControlsChange}
      />
      {/* <PaginationControls
        page={params.page}
        pageSize={params.pageSize}
        hasNext={hasNext}
        onChange={setParams}
      /> */}

    </div>
  );
}
