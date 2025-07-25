import { z } from "@hono/zod-openapi";

/**
 * Generic pagination params: page number (1-based) and page size.
 */
export const paginationParamsSchema = z.object({
    page: z
        .string()
        .optional()
        .default("1")
        .transform(val => Number.parseInt(val, 10))
        .pipe(z.number().int().positive()),
    pageSize: z
        .string()
        .optional()
        .default("20")
        .transform(val => Number.parseInt(val, 10))
        .pipe(z.number().int().positive()),
});
export type PaginationParams = z.infer<typeof paginationParamsSchema>;

/**
 * Direction for sorting: ascending or descending.
 */
export const sortDirectionEnum = z.enum(["asc", "desc"]);
export type SortDirection = z.infer<typeof sortDirectionEnum>;

/**
 * Create a Zod schema for sorting params based on allowed fields.
 *
 * @param fields - Tuple of valid field names for sorting
 */
export function createSortingParamsSchema<Fields extends readonly [string, ...string[]]>(
    fields: Fields,
) {
    return z.object({
        sortBy: z.enum(fields).optional(),
        sortDirection: sortDirectionEnum.optional().default("asc"),
    });
}
export type SortingParams<Fields extends readonly [string, ...string[]]> = z.infer<ReturnType<typeof createSortingParamsSchema<Fields>>>;

/**
 * Create a Zod schema for filtering params based on allowed fields.
 * Supports basic equality filters via query string: ?field=value&other=val
 *
 * @param fields - Tuple of valid field names for filtering
 */
export function createFilteringParamsSchema<Fields extends readonly [string, ...string[]]>(
    fields: Fields,
) {
    // Build a shape object with string keys to avoid indexing errors
    const shape: Record<string, z.ZodOptional<z.ZodString>> = {};
    for (const f of fields) {
        shape[f] = z.string().optional();
    }
    // Cast to ZodObject with specific fields keys
    return z.object(shape) as z.ZodObject<Record<Fields[number], z.ZodOptional<z.ZodString>>>;
}
/**
 * Create a Zod schema for advanced filtering params with operators (eq, ne, contains, gt, gte, lt, lte).
 * Supports both plain value (shorthand for eq) and operator-suffixed fields.
 * @param fields - Tuple of valid field names for filtering
 */
export function createAdvancedFilteringParamsSchema<Fields extends readonly [string, ...string[]]>(
    fields: Fields,
) {
    const operators = ["eq", "ne", "contains", "gt", "gte", "lt", "lte"] as const;
    const shape: Record<string, z.ZodOptional<z.ZodString>> = {};
    for (const field of fields) {
        // plain shorthand equals
        shape[field] = z.string().optional();
        for (const op of operators) {
            shape[`${field}_${op}`] = z.string().optional();
        }
    }
    return z.object(shape) as z.ZodObject<
        Record<
            Fields[number] | `${Fields[number]}_${typeof operators[number]}`,
            z.ZodOptional<z.ZodString>
        >
    >;
}
export type FilteringParams<Fields extends readonly [string, ...string[]]> = z.infer<ReturnType<typeof createFilteringParamsSchema<Fields>>>;
