import type { Context } from "hono";
import z from "zod";

export const IssueSchema = z.object({
  issues: z.array(z.record(z.string(), z.string())),
});

export const NotFoundSchema = z.object({
  message: z.string(),
});

export function notFoundResponse(c: Context) {
  return c.json({ message: "Not found" }, 404);
}
