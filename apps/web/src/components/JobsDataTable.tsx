import type { selectJobsSchema } from "@tasks-app/api/schema";

import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import * as React from "react";

import type { ColumnDef } from "@workspace/ui/features/data-table/data-table-types";

import { jobsQueryOptions } from "@/web/lib/queries/jobs.queries";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { DataTable } from "@workspace/ui/features/data-table/subcomponents/data-table";
import { DataTableToolbar } from "@workspace/ui/features/data-table/subcomponents/data-table-toolbar";
import { useDataTable } from "@workspace/ui/features/data-table/use-data-table";

// Top-level component for actions menu
function ActionsCell() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function JobsDataTable() {
  // Sync query params from URL
  const [page] = useQueryState("page", parseAsString.withDefault("1"));
  const [pageSize] = useQueryState("pageSize", parseAsString.withDefault("10"));
  // Sync sort and filter params from URL
  const [sortBy] = useQueryState("sortBy", parseAsString.withDefault("createdAt"));
  const [sortDirection] = useQueryState("sortDirection", parseAsString.withDefault("asc"));
  const [status] = useQueryState("status", parseAsArrayOf(parseAsString).withDefault([]));

  // Fetch jobs using React Query and our hook
  const { data: jobs = [] } = useQuery(
    jobsQueryOptions({ page, pageSize, sortBy, sortDirection, status }),
  );

  // Define columns (to be implemented)
  const columns = React.useMemo<ColumnDef<selectJobsSchema>[]>(
    () => [
      {
        id: "actions",
        cell: ActionsCell,
        size: 32,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data: jobs ?? [],
    columns,
    pageCount: 1,
  });

  return (
    <div className="data-table-container">
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
}
