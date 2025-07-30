import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";

// Props for the sort controls: only changes to sortBy/sortDirection are emitted
import type { SortControlsProps } from "./types";

export function SortControls<K extends string>({ sortKeys, sortBy, sortDirection, onChange }: SortControlsProps<K>) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 flex-nowrap">
        <Label className="text-nowrap">Sort By:</Label>
        <Select
          value={sortBy ?? ""}
          onValueChange={value => onChange({ sortBy: value as K })}
        >
          <SelectTrigger>
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent>
            {/* <SelectItem value="">--</SelectItem> */}
            {sortKeys.map(key => (
              <SelectItem key={key} value={key}>
                {key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Direction toggle */}
      <Button
        variant="outline"
        size="icon"
        aria-label={
          sortDirection === "asc"
            ? "Switch to descending sort"
            : "Switch to ascending sort"
        }
        onClick={() =>
          onChange({
            sortDirection:
              sortDirection === "asc" ? "desc" : "asc",
          } as any)}
      >
        {sortDirection === "asc"
          ? (
              <ChevronUpIcon />
            )
          : (
              <ChevronDownIcon />
            )}
      </Button>
    </div>
  );
}
