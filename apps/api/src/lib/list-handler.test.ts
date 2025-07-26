import { describe, expect, it, vi } from "vitest";

import { createListHandler } from "./list-handler";

describe("createListHandler", () => {
    it("paginates and returns hasNext=true when more records exist", async () => {
        // prepare
        const mockFindMany = vi.fn().mockResolvedValue(["a", "b", "c", "d"]);
        const handler = createListHandler(
            opts => mockFindMany(opts as any),
            {},
            [],
            [],
        );
        // fake context
        const fakeCtx: any = {
            req: { valid: () => ({ page: 1, pageSize: 3 }) },
            json: (payload: any) => payload,
        };

        // execute
        const result = await handler(fakeCtx, {} as any);

        // assert
        expect(mockFindMany).toHaveBeenCalledWith(
            expect.objectContaining({ limit: 4, offset: 0 }),
        );
        expect(result).toEqual({ items: ["a", "b", "c"], hasNext: true });
    });

    it("paginates and returns hasNext=false when fewer records exist", async () => {
        const mockFindMany = vi.fn().mockResolvedValue([1, 2]);
        const handler = createListHandler(
            opts => mockFindMany(opts as any),
            {},
            [],
            [],
        );
        const fakeCtx: any = {
            req: { valid: () => ({ page: 2, pageSize: 5 }) },
            json: (payload: any) => payload,
        };

        const result = await handler(fakeCtx, {} as any);
        expect(mockFindMany).toHaveBeenCalledWith(
            expect.objectContaining({ limit: 6, offset: 5 }),
        );
        expect(result).toEqual({ items: [1, 2], hasNext: false });
    });
});
