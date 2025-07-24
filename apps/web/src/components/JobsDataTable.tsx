import type { selectJobsSchema } from "@tasks-app/api/schema";

import { useQuery } from "@tanstack/react-query";
import { Archive, CheckCircle, MoreHorizontal, Pause, Text } from "lucide-react";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import * as React from "react";

import type { ColumnDef } from "@workspace/ui/features/data-table/data-table-types";

import dateFormatter from "@/web/lib/date-formatter";
import { jobsQueryOptions } from "@/web/lib/queries/jobs.queries";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu";
import { DataTable } from "@workspace/ui/features/data-table/subcomponents/data-table";
import { DataTableColumnHeader } from "@workspace/ui/features/data-table/subcomponents/data-table-column-header";
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
  const [sortBy] = useQueryState("sortBy", parseAsString.withDefault("createdAt"));
  const [sortDirection] = useQueryState("sortDirection", parseAsString.withDefault("asc"));
  const [status] = useQueryState("status", parseAsArrayOf(parseAsString).withDefault([]));

  // Fetch jobs using React Query and our hook
  const { data: jobs = [] } = useQuery(
    jobsQueryOptions({ page, pageSize, sortBy, sortDirection, status }),
  );

  // Define columns
  const columns = React.useMemo<ColumnDef<selectJobsSchema>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
              || (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all jobs"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={value => row.toggleSelected(!!value)}
            aria-label="Select job"
          />
        ),
        size: 32,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "definitionNL",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Prompt" />
        ),
        cell: ({ cell }) => <div>{cell.getValue<string>()}</div>,
        meta: {
          label: "Prompt",
          placeholder: "Search prompts...",
          variant: "text",
          icon: Text,
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ cell }) => (
          <Badge variant="outline" className="capitalize">
            {cell.getValue<string>()}
          </Badge>
        ),
        meta: {
          label: "Status",
          variant: "multiSelect",
          options: [
            { label: "Active", value: "ACTIVE", icon: CheckCircle },
            { label: "Paused", value: "PAUSED", icon: Pause },
            { label: "Archived", value: "ARCHIVED", icon: Archive },
          ],
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created" />
        ),
        cell: ({ cell }) => (
          <div>{dateFormatter.format(new Date(cell.getValue<string>()))}</div>
        ),
        meta: {
          label: "Created",
          variant: "dateRange",
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: "nextRunAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Next Run" />
        ),
        cell: ({ cell }) => {
          const val = cell.getValue<string | null>();
          return <div>{val ? dateFormatter.format(new Date(val)) : "N/A"}</div>;
        },
        meta: {
          label: "Next Run",
          variant: "dateRange",
        },
        enableColumnFilter: true,
      },
      {
        id: "actions",
        cell: ActionsCell,
        size: 32,
        enableSorting: false,
        enableHiding: true,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data: jobs ?? [],
    columns,
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: Number.parseInt(page, 10) - 1, pageSize: Number.parseInt(pageSize, 10) },
      sorting: [{ id: sortBy as keyof selectJobsSchema, desc: sortDirection === "desc" }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: row => row.id,
  });

  return (
    <div className="data-table-container">
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
}
