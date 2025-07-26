import type { ListJobsQuery } from "@tasks-app/api/schema";

export type PaginationControlsProps = {
  page?: number;
  pageSize?: number;
  onChange: (newParams: Partial<ListJobsQuery>) => void;
  /** Whether there are more pages after the current one */
  hasNext?: boolean;
};

export function PaginationControls({ page = 1, pageSize = 10, onChange, hasNext }: PaginationControlsProps) {
  return (
    <div className="flex items-center space-x-4 mt-4">
      <button
        type="button"
        className="px-2 py-1 border rounded disabled:opacity-50"
        disabled={page <= 1}
        onClick={() => onChange({ page: page - 1 })}
      >
        Prev
      </button>
      <span>
        Page
        {page}
      </span>
      <button
        type="button"
        className="px-2 py-1 border rounded disabled:opacity-50"
        disabled={hasNext === false}
        onClick={() => onChange({ page: page + 1 })}
      >
        Next
      </button>
      <label className="ml-4 flex items-center space-x-2">
        <span>Page Size:</span>
        <input
          type="number"
          min={1}
          className="border rounded px-2 py-1 w-20"
          value={pageSize}
          onChange={e => onChange({ pageSize: Number(e.target.value) })}
        />
      </label>
    </div>
  );
}
