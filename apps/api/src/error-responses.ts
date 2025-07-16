import { resolver } from "hono-openapi/zod";
import { IssueSchema, NotFoundSchema } from "./response-schemas";

export const errorResponses_400_and_404 = {
  400: {
    description: "Invalid request",
    content: {
      "application/json": {
        schema: resolver(IssueSchema),
      },
    },
  },
  404: {
    description: "Not found",
    content: {
      "application/json": {
        schema: resolver(NotFoundSchema),
      },
    },
  },
};
