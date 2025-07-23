import type { ColumnSort, Row, RowData } from "@tanstack/react-table";

import type { DataTableConfig } from "@workspace/ui/features/data-table/data-table-config";
import type { FilterItemSchema } from "@workspace/ui/features/data-table/data-table-parsers";

declare module "@tanstack/react-table" {
  // @ts-expect-error - Extend the Column interface to include metadata
  // eslint-disable-next-line unused-imports/no-unused-vars
  type ColumnMeta<TData extends RowData, TValue> = {
    label?: string;
    placeholder?: string;
    variant?: FilterVariant;
    options?: Option[];
    range?: [number, number];
    unit?: string;
    icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  };
}

export type Option = {
  label: string;
  value: string;
  count?: number;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
};

export type FilterOperator = DataTableConfig["operators"][number];
export type FilterVariant = DataTableConfig["filterVariants"][number];
export type JoinOperator = DataTableConfig["joinOperators"][number];

export type ExtendedColumnSort<TData> = {
  id: Extract<keyof TData, string>;
} & Omit<ColumnSort, "id">;

export type ExtendedColumnFilter<TData> = {
  id: Extract<keyof TData, string>;
} & FilterItemSchema;

export type DataTableRowAction<TData> = {
  row: Row<TData>;
  variant: "update" | "delete";
};

export type { Column, ColumnDef } from "@tanstack/react-table";
