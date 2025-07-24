import { type AnyColumn, asc, desc } from "drizzle-orm";

import type { PaginationParams, SortDirection } from "./query-params";

/**
 * Build pagination options for Drizzle: limit & offset.
 */
export function buildPagination({ page, pageSize }: PaginationParams) {
    return {
        limit: pageSize,
        offset: (page - 1) * pageSize,
    };
}

/**
 * Pick a subset of columns from a Drizzle table object.
 * @param table - The Drizzle table with column properties
 * @param keys - Array of column names to extract
 */
export function pickColumns<T extends object, K extends readonly (keyof T)[]>(
    table: T,
    keys: K,
): Pick<T, K[number]> {
    const result = {} as Pick<T, K[number]>;
    for (const key of keys) {
        result[key] = table[key];
    }
    return result;
}

/**
 * Build an orderBy clause for Drizzle based on sorting params.
 * The table parameter can be any object whose properties include Drizzle columns.
 */
export function buildOrderBy(
    params: { sortBy?: string; sortDirection?: SortDirection },
    table: unknown,
): ReturnType<typeof asc>[] | ReturnType<typeof desc>[] | undefined {
    const { sortBy, sortDirection = "asc" } = params;
    if (!sortBy)
        return undefined;
    // Cast table to a map of column values internally
    const columnsMap = table as Record<string, AnyColumn>;
    const column = columnsMap[sortBy];
    return sortDirection === "desc" ? [desc(column)] : [asc(column)];
}

/**
 * Build a where function for Drizzle based on simple equality filters.
 * Returns undefined if no filters provided or empty.
 */
export function buildWhere(
    filters?: Record<string, string>,
): ((fields: any, ops: any) => any) | undefined {
    if (!filters || Object.keys(filters).length === 0)
        return undefined;
    const entries = Object.entries(filters) as [string, string][];
    return (fields: any, ops: any) =>
        ops.and(
            ...entries.map(([key, value]) => ops.eq((fields as any)[key], value)),
        );
}

/**
 * Build Drizzle query options (limit, offset, orderBy, where) from validated params.
 * @param params - Parsed query params including pagination, sorting, and filter keys
 * @param table - Drizzle table object with column properties
 * @param sortable - Array of column names allowed for ordering
 * @param filterable - Array of param keys allowed for filtering
 */
export function buildQueryOptions<
    T extends object,
    SortKeys extends Extract<keyof T, string>,
    FilterKeys extends string,
>(
    params: PaginationParams & { sortBy?: SortKeys; sortDirection?: SortDirection } & Partial<Record<FilterKeys, string>>,
    table: T,
    sortable: readonly SortKeys[],
    filterable: readonly FilterKeys[],
) {
    // pagination
    const pagination = buildPagination(params);
    // ordering
    const colsMap = pickColumns(table, sortable as any);
    // explicit default sort by first allowed key if none provided
    const orderBy
        = buildOrderBy(params, colsMap) ?? [asc(colsMap[sortable[0]])];
    // filtering
    const filters: Record<string, string> = {};
    for (const key of filterable) {
        const val = params[key];
        if (val !== undefined) {
            filters[key] = val;
        }
    }
    const where = buildWhere(filters);
    return {
        ...pagination,
        ...(orderBy ? { orderBy } : {}),
        ...(where ? { where } : {}),
    };
}
