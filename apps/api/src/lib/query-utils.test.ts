import { describe, expect, it } from "vitest";

import { buildAdvancedWhere } from "./query-utils";

describe("buildAdvancedWhere", () => {
    it("should build eq clause for plain field", () => {
        const filters = { status: "PAUSED" };
        const where = buildAdvancedWhere(filters)!;
        const fields = { status: "statusCol" };
        const ops = {
            and: (...clauses: any[]) => clauses,
            eq: (col: any, val: any) => ({ op: "eq", col, val }),
        };
        const clauses = where(fields as any, ops as any);
        expect(clauses).toEqual([{ op: "eq", col: "statusCol", val: "PAUSED" }]);
    });

    it("should build various operator clauses", () => {
        const filters = {
            status_eq: "ACTIVE",
            status_ne: "PAUSED",
            definitionNL_contains: "foo",
            createdAt_gt: "2025-01-01",
            updatedAt_lte: "2025-12-31",
        };
        const where = buildAdvancedWhere(filters)!;
        const fields = {
            status: "statusCol",
            definitionNL: "defCol",
            createdAt: "createdCol",
            updatedAt: "updatedCol",
        };
        const ops = {
            and: (...clauses: any[]) => clauses,
            eq: (col: any, val: any) => ({ op: "eq", col, val }),
            ne: (col: any, val: any) => ({ op: "ne", col, val }),
            like: (col: any, val: any) => ({ op: "like", col, val }),
            gt: (col: any, val: any) => ({ op: "gt", col, val }),
            gte: (col: any, val: any) => ({ op: "gte", col, val }),
            lt: (col: any, val: any) => ({ op: "lt", col, val }),
            lte: (col: any, val: any) => ({ op: "lte", col, val }),
        };
        const clauses = where(fields as any, ops as any);
        expect(clauses).toEqual([
            { op: "eq", col: "statusCol", val: "ACTIVE" },
            { op: "ne", col: "statusCol", val: "PAUSED" },
            { op: "like", col: "defCol", val: "%foo%" },
            { op: "gt", col: "createdCol", val: "2025-01-01" },
            { op: "lte", col: "updatedCol", val: "2025-12-31" },
        ]);
    });
});
