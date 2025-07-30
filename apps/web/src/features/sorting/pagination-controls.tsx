import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";

import type { PaginationControlsProps } from "./types";

const PAGE_SIZE_OPTIONS = [
  { value: 5, label: "5 per page" },
  { value: 10, label: "10 per page" },
  { value: 20, label: "20 per page" },
  { value: 50, label: "50 per page" },
];

export function PaginationControls({ page, pageSize, hasNext, onChange }: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between gep-4">
      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Show:</span>
        <Select value={pageSize ? pageSize.toString() : ""} onValueChange={value => onChange({ pageSize: Number(value) })}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Navigation buttons */}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!!page && page <= 1}
          onClick={() => onChange({ page: page ? page - 1 : 1 })}
        >
          <ChevronLeft className="w-4 h-4" />

          Prev
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium px-3 py-1 bg-primary text-primary-foreground rounded">
            {page}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={hasNext === false}
          onClick={() => onChange({ page: page ? page + 1 : 1 })}
        >
          Next
          <ChevronRight className="w-4 h-4" />

        </Button>

      </div>
      {/* <div className="flex items-center space-x-2">
        <Label>Page Size:</Label>
        <Input
          type="number"
          min={1}
          className="w-20"
          value={pageSize}
          onChange={e => onChange({ pageSize: Number(e.target.value) })}
        />
      </div> */}

    </div>
  );
}
