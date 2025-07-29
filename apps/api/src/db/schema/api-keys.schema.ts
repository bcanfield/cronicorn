/* eslint-disable ts/no-redeclare */
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { apiKeys } from "@/api/db/schema";

// Zod schemas for API keys
export const selectApiKeysSchema = createSelectSchema(apiKeys);
export type selectApiKeysSchema = z.infer<typeof selectApiKeysSchema>;

// For insertion, we don't want to include some auto-generated fields
export const insertApiKeysSchema = createInsertSchema(
    apiKeys,
    {
        name: schema => schema.min(1).max(255),
        description: schema => schema.max(1000).optional(),
        scopes: schema => schema.optional(),
        expiresAt: schema => schema.optional(),
    },
)
    .omit({
        id: true,
        userId: true,
        key: true,
        secret: true,
        lastUsedAt: true,
        revoked: true,
        createdAt: true,
        updatedAt: true,
    })
    .required({ name: true });

export type insertApiKeysSchema = z.infer<typeof insertApiKeysSchema>;

// For updates, only allow name, description, and scopes to be modified
export const patchApiKeysSchema = createInsertSchema(
    apiKeys,
    {
        name: schema => schema.min(1).max(255),
        description: schema => schema.max(1000).optional(),
        scopes: schema => schema.optional(),
    },
)
    .omit({
        id: true,
        userId: true,
        key: true,
        secret: true,
        lastUsedAt: true,
        revoked: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
    })
    .partial();

export type patchApiKeysSchema = z.infer<typeof patchApiKeysSchema>;

export const API_KEY_SORT_KEYS = ["name", "createdAt", "lastUsedAt", "expiresAt"] as const;

// LIST API KEYS QUERY SCHEMA
export const listApiKeysSchema = z.object({
    // Default to show latest items first
    sortBy: z.enum(API_KEY_SORT_KEYS).default("createdAt").describe("Field to sort by"),
    sortDirection: z.enum(["asc", "desc"]).default("desc").describe("Sort direction"),
    page: z.coerce.number().default(1).describe("Page number for pagination"),
    pageSize: z.coerce.number().default(20).describe("Number of items per page"),
});

export type listApiKeysSchema = z.infer<typeof listApiKeysSchema>;
