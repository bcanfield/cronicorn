import type { AppRouteHandler } from "@/api/lib/types";

import { buildQueryOptions } from "@/api/lib/query-utils";

/**
 * Create a generic list handler that supports pagination, sorting, and filtering.
 * @param findMany - function that fetches records given Drizzle-style query options
 * @param table - Drizzle table object (for column extraction)
 * @param sortable - array of column keys allowed for sorting
 * @param filterable - array of query param keys allowed for filtering
 */
export function createListHandler<SortKeys extends string, FilterKeys extends string, Item>(
    findMany: (opts: any) => Promise<Item[]>,
    table: Record<string, any>,
    sortable: readonly SortKeys[],
    filterable: readonly FilterKeys[],
): AppRouteHandler<any> {
    return async (c) => {
        // validate query params (pagination, sorting, filtering)
        const params = (c.req as any).valid("query") as {
            page: number;
            pageSize: number;
            [key: string]: any;
        };
        // build Drizzle query options
        const options = buildQueryOptions(params as any, table, sortable, filterable);
        // fetch one extra record to detect next page
        const extraLimit = params.pageSize + 1;
        const recordsPlus = await findMany({ ...options, limit: extraLimit });
        // determine pagination result
        const hasNext = recordsPlus.length > params.pageSize;
        const items = hasNext ? recordsPlus.slice(0, params.pageSize) : recordsPlus;
        return c.json({ items, hasNext });
    };
}
