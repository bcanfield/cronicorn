import z, { type ZodSchema } from "zod";
import type { ValidationTargets } from "hono";
import { validator as zv } from "hono-openapi/zod";

export const zValidator = <
  T extends ZodSchema,
  Target extends keyof ValidationTargets
>(
  target: Target,
  schema: T
) =>
  zv(target, schema, (result, c) => {
    console.log({ result });
    if (!result.success) {
      return c.json({ issues: result?.error?.issues }, 400);
    }
  });
