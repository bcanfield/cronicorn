// filepath: /Users/bcanfield/testapp/apps/api/src/resolvers/jobs.ts
import {
  createJob,
  deleteJob,
  getJobs,
  getJobById,
  getPagination,
  InsertJobsSchema,
  JobSchema,
  PaginationSchema,
  updateJob,
  UpdateJobsSchema,
} from "@cronicorn/database";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { zValidator } from "../zod-validation-wrapper";
import { errorResponses_400_and_404 } from "../error-responses";
import { notFoundResponse } from "../response-schemas";
import { IdSchema } from "../id-schema";

const app = new Hono();

// ─── Create ─────────────────────────────────────────────────────────────────
const route = app
  .post(
    "/",
    describeRoute({
      description: "Create a new job",
      responses: {
        201: {
          description: "Job created",
          content: {
            "application/json": {
              schema: resolver(JobSchema),
            },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("json", InsertJobsSchema),
    async (c) => {
      const input = c.req.valid("json");
      const job = await createJob(input);
      c.header("Location", `${c.req.path}/${job.id}`);
      return c.json(job, 201);
    }
  )
  .get(
    "/",
    describeRoute({
      description: "Get a paginated list of jobs",
      responses: {
        200: {
          description: "List of jobs",
          content: {
            "application/json": {
              schema: resolver(JobSchema.array()),
            },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("query", PaginationSchema),
    async (c) => {
      const query = c.req.valid("query");
      const { page, limit } = getPagination(query);
      const jobs = await getJobs({ page, limit });
      return c.json(jobs);
    }
  )
  .get(
    "/:id",
    describeRoute({
      description: "Get a job by ID",
      responses: {
        200: {
          description: "Job details",
          content: {
            "application/json": {
              schema: resolver(JobSchema),
            },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const job = await getJobById(id);
      if (!job) return notFoundResponse(c);
      return c.json(job);
    }
  )
  .put(
    "/:id",
    describeRoute({
      description: "Update a job by ID",
      responses: {
        200: {
          description: "Updated job details",
          content: {
            "application/json": {
              schema: resolver(JobSchema),
            },
          },
        },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    zValidator("json", UpdateJobsSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");
      const updated = await updateJob(id, data);
      if (!updated) return notFoundResponse(c);
      return c.json(updated);
    }
  )
  .delete(
    "/:id",
    describeRoute({
      description: "Delete a job by ID",
      responses: {
        200: { description: "Deleted" },
        ...errorResponses_400_and_404,
      },
    }),
    zValidator("param", IdSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const deleted = await deleteJob(id);
      console.log("Deleted job:", deleted);
      if (!deleted) return notFoundResponse(c);
      return c.json(undefined, 200);
    }
  );

export default app;
export type AppType = typeof route;
