// Props for the sort controls: only changes to sortBy/sortDirection are emitted
export type SortControlsProps<K extends string> = {
  sortKeys: readonly K[];
  sortBy?: K;
  sortDirection?: "asc" | "desc";
  onChange: (change: Partial<{
    sortBy: K;
    sortDirection: "asc" | "desc";
  }>) => void;
};
export function SortControls<K extends string>({ sortKeys, sortBy, sortDirection, onChange }: SortControlsProps<K>) {
  return (
    <div className="flex items-center space-x-4">
      <label>
        Sort By:
        <select
          className="ml-2 border rounded px-2 py-1"
          value={sortBy ?? ""}
          onChange={e => onChange({ sortBy: e.target.value as K })}
        >
          <option value="">--</option>
          {sortKeys.map(key => (
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
          value={sortDirection ?? "desc"}
          onChange={e => onChange({ sortDirection: e.target.value as "asc" | "desc" })}
        >
          <option value="asc">asc</option>
          <option value="desc">desc</option>
        </select>
      </label>
    </div>
  );
}
