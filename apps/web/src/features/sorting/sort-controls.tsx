import type { JobsSortKey } from "@tasks-app/api/schema";

import { JOBS_SORT_KEYS } from "@tasks-app/api/schema";

export type SortControlsProps = {
  sortBy?: JobsSortKey;
  sortDirection?: "asc" | "desc";
  onChange: (params: { sortBy?: JobsSortKey; sortDirection?: "asc" | "desc" }) => void;
};

export function SortControls({ sortBy, sortDirection, onChange }: SortControlsProps) {
  return (
    <div className="flex items-center space-x-4">
      <label>
        Sort By:
        <select
          className="ml-2 border rounded px-2 py-1"
          value={sortBy ?? ""}
          onChange={e => onChange({ sortBy: e.target.value as JobsSortKey })}
        >
          <option value="">--</option>
          {JOBS_SORT_KEYS.map(key => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </label>
      <label>
        Direction:
        <select
          className="ml-2 border rounded px-2 py-1"
          value={sortDirection ?? "asc"}
          onChange={e => onChange({ sortDirection: e.target.value as "asc" | "desc" })}
        >
          <option value="asc">asc</option>
          <option value="desc">desc</option>
        </select>
      </label>
    </div>
  );
}
