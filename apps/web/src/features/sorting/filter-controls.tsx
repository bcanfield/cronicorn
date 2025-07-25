import type { ListJobsQuery } from "@tasks-app/api/schema";

import { JOBS_FILTER_KEYS } from "@tasks-app/api/schema";

export type FilterControlsProps = {
  filters: ListJobsQuery;
  onChange: (newFilters: Partial<ListJobsQuery>) => void;
};

export function FilterControls({ filters, onChange }: FilterControlsProps) {
  return (
    <div className="flex items-center space-x-4 mb-4">
      {JOBS_FILTER_KEYS.map(key => (
        <label key={key} className="flex items-center">
          {key}
          :
          <input
            type="text"
            className="ml-2 border rounded px-2 py-1"
            value={(filters[key] as string) ?? ""}
            onChange={e => onChange({ [key]: e.target.value })}
          />
        </label>
      ))}
    </div>
  );
}
