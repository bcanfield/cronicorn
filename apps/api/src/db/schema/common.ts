import { z } from "zod";

// Common query parameter schemas
export const sortDirectionSchema = z.enum(["asc", "desc"]).default("desc").describe("Sort direction");
export const pageSchema = z.coerce.number().default(1).describe("Page number for pagination");
export const pageSizeSchema = z.coerce.number().default(20).describe("Number of items per page");
