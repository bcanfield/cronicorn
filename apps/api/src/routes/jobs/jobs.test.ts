/* eslint-disable ts/ban-ts-comment */

import { testClient } from "hono/testing";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { beforeAll, describe, expect, it } from "vitest";
import { ZodIssueCode } from "zod";

import db from "@/api/db";
import resetDb from "@/api/db/reset";
import { jobs as jobsTable } from "@/api/db/schema";
import { users } from "@/api/db/schema/auth";
import env from "@/api/env";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/api/lib/constants";
import createApp from "@/api/lib/create-app";

import router from "./jobs.index";

if (env.NODE_ENV !== "test") {
  throw new Error("NODE_ENV must be 'test'");
}

const client = testClient(createApp().route("/", router));

describe("jobs routes", () => {
  let createdId: string;
  let testUserId: string;
  const definitionNL = "Test job definition";

  // Seed a test user for all jobs tests
  beforeAll(async () => {
    await resetDb();
    const [user] = await db.insert(users).values({ email: "test@jobs.com" }).returning();
    testUserId = user.id;
  });
  // == Validation Tests ==
  it("post /jobs validates the body when creating", async () => {
    const response = await client.api.jobs.$post({
      // @ts-expect-error
      json: {},
    });
    expect(response.status).toBe(422);
    if (response.status === 422) {
      const json = await response.json();
      expect(json.error.issues[0].path[0]).toBe("definitionNL");
      expect(json.error.issues[0].message).toBe(ZOD_ERROR_MESSAGES.REQUIRED);
    }
  });

  // == Creation Tests ==
  it("post /jobs creates a job", async () => {
    const response = await client.api.jobs.$post({
      json: { definitionNL },
    });

    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.definitionNL).toBe(definitionNL);
      createdId = json.id;
    }
  });

  // == Retrieval Tests ==
  it("get /jobs lists all jobs", async () => {
    const response = await client.api.jobs.$get({ query: {} });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const { items, hasNext } = await response.json();
      expect(Array.isArray(items)).toBe(true);
      expect(items.some(j => j.id === createdId && j.definitionNL === definitionNL)).toBe(true);
      expect(hasNext).toBe(false);
    }
  });

  it("get /jobs/{id} validates the id param", async () => {
    const response = await client.api.jobs[":id"].$get({
      param: {
        // @ts-expect-error
        id: 12,
      },
    });
    expect(response.status).toBe(422);
    if (response.status === 422) {
      const json = await response.json();
      expect(json.error.issues[0].path[0]).toBe("id");
    }
  });

  it("get /jobs/{id} returns a job", async () => {
    const response = await client.api.jobs[":id"].$get({ param: { id: createdId } });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.id).toBe(createdId);
      expect(json.definitionNL).toBe(definitionNL);
    }
  });

  // == Update Tests ==
  it("patch /jobs/{id} validates the body when updating", async () => {
    const response = await client.api.jobs[":id"].$patch({
      param: {
        id: createdId,
      },
      json: {
        definitionNL: "",
      },
    });
    expect(response.status).toBe(422);
    if (response.status === 422) {
      const json = await response.json();
      expect(json.error.issues[0].path[0]).toBe("definitionNL");
      expect(json.error.issues[0].code).toBe(ZodIssueCode.too_small);
    }
  });

  it("patch /jobs/{id} validates empty body", async () => {
    const response = await client.api.jobs[":id"].$patch({ param: { id: createdId }, json: {} });
    expect(response.status).toBe(422);
    if (response.status === 422) {
      const json = await response.json();
      expect(json.error.issues[0].code).toBe(ZOD_ERROR_CODES.INVALID_UPDATES);
      expect(json.error.issues[0].message).toBe(ZOD_ERROR_MESSAGES.NO_UPDATES);
    }
  });

  it("patch /jobs/{id} updates a job property", async () => {
    const newStatus = "ACTIVE";
    const response = await client.api.jobs[":id"].$patch({ param: { id: createdId }, json: { status: newStatus } });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.status).toBe(newStatus);
    }
  });

  // == Deletion Tests ==
  it("delete /jobs/{id} deletes a job", async () => {
    const response = await client.api.jobs[":id"].$delete({ param: { id: createdId } });
    expect(response.status).toBe(204);
  });

  // == Non-Existent Resource Error Tests ==
  it("get /jobs/{id} returns 404 when not found", async () => {
    const response = await client.api.jobs[":id"].$get({ param: { id: "11111111-1111-1111-1111-111111111111" } });
    expect(response.status).toBe(404);
    if (response.status === 404) {
      const json = await response.json();
      expect(json.message).toBe(HttpStatusPhrases.NOT_FOUND);
    }
  });

  it("patch /jobs/{id} returns 404 when updating non-existent job", async () => {
    const nonExistentId = "11111111-1111-1111-1111-111111111111";
    const response = await client.api.jobs[":id"].$patch({ param: { id: nonExistentId }, json: { status: "ACTIVE" } });
    expect(response.status).toBe(404);
    if (response.status === 404) {
      const json = await response.json();
      expect(json.message).toBe(HttpStatusPhrases.NOT_FOUND);
    }
  });

  it("delete /jobs/{id} returns 404 when deleting non-existent job", async () => {
    const nonExistentId = "11111111-1111-1111-1111-111111111111";
    const response = await client.api.jobs[":id"].$delete({ param: { id: nonExistentId } });
    expect(response.status).toBe(404);
    if (response.status === 404) {
      const json = await response.json();
      expect(json.message).toBe(HttpStatusPhrases.NOT_FOUND);
    }
  });

  // == List, Pagination, Sorting & Filtering Tests ==
  describe("get /jobs with pagination, sorting, filtering", () => {
    let ids: string[];
    beforeAll(async () => {
      // Seed additional jobs for pagination tests using existing user
      ids = [];
      // Seed three jobs
      ids = [];
      for (const name of ["A-job", "B-job", "C-job"]) {
        const response = await client.api.jobs.$post({
          json: { definitionNL: name },
        });
        expect(response.status).toBe(200);
        if (response.status === 200) {
          const json = await response.json();
          ids.push(json.id);
        }
      }
      // Update statuses: first ACTIVE, last ARCHIVED
      await client.api.jobs[":id"].$patch({ param: { id: ids[0] }, json: { status: "ACTIVE" } });
      await client.api.jobs[":id"].$patch({ param: { id: ids[2] }, json: { status: "ARCHIVED" } });
    });

    it("paginates results", async () => {
      const response = await client.api.jobs.$get({ query: { page: 1, pageSize: 2 } });
      expect(response.status).toBe(200);
      if (response.status === 200) {
        const { items, hasNext } = await response.json();
        expect(items).toHaveLength(2);
        expect(items[0].definitionNL).toBe("C-job");
        expect(items[1].definitionNL).toBe("B-job");
        expect(hasNext).toBe(true);
      }
    });

    it("sorts results by createdAt desc", async () => {
      const response = await client.api.jobs.$get({ query: { sortBy: "createdAt", sortDirection: "desc" } });
      expect(response.status).toBe(200);
      if (response.status === 200) {
        const { items } = await response.json();
        expect(items[0].definitionNL).toBe("C-job");
        expect(items[2].definitionNL).toBe("A-job");
      }
    });
    it("sorts results by createdAt asc", async () => {
      const response = await client.api.jobs.$get({ query: { sortBy: "createdAt", sortDirection: "asc" } });
      expect(response.status).toBe(200);
      if (response.status === 200) {
        const { items } = await response.json();
        expect(items[0].definitionNL).toBe("A-job");
        expect(items[2].definitionNL).toBe("C-job");
      }
    });
    it("handles invalid sortBy gracefully", async () => {
      // @ts-expect-error: testing invalid sortBy
      const response = await client.api.jobs.$get({ query: { sortBy: "INVALID", sortDirection: "asc" } });
      expect(response.status).toBe(422);
    });

    it("filters results by searchQuery", async () => {
      const response = await client.api.jobs.$get({ query: { searchQuery: "B-job" } });
      expect(response.status).toBe(200);
      if (response.status === 200) {
        const { items, hasNext } = await response.json();
        expect(items).toHaveLength(1);
        expect(items[0].definitionNL).toBe("B-job");
        expect(hasNext).toBe(false);
      }
    });
  });

  // == Auth Enforcement Tests ==
  it("returns 404 when fetching a job not owned by DEV_USER", async () => {
    const [{ id: otherJobId }] = await db.insert(jobsTable)
      .values({ definitionNL: "Other Job", userId: testUserId })
      .returning();
    const response = await client.api.jobs[":id"].$get({ param: { id: otherJobId } });
    expect(response.status).toBe(404);
  });
  it("returns 404 when updating a job not owned by DEV_USER", async () => {
    const [{ id: otherJobId }] = await db.insert(jobsTable)
      .values({ definitionNL: "Other Job 2", userId: testUserId })
      .returning();
    const response = await client.api.jobs[":id"].$patch({ param: { id: otherJobId }, json: { definitionNL: "Updated Job Text" } });
    expect(response.status).toBe(404);
  });
  it("returns 404 when deleting a job not owned by DEV_USER", async () => {
    const [{ id: otherJobId }] = await db.insert(jobsTable)
      .values({ definitionNL: "Other Job 3", userId: testUserId })
      .returning();
    const response = await client.api.jobs[":id"].$delete({ param: { id: otherJobId } });
    expect(response.status).toBe(404);
  });
});
