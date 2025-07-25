/* eslint-disable ts/ban-ts-comment */

import { testClient } from "hono/testing";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { beforeAll, describe, expect, it } from "vitest";
import { ZodIssueCode } from "zod";

import db from "@/api/db";
import { users } from "@/api/db/auth-schema";
import resetDb from "@/api/db/reset";
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

  beforeAll(async () => {
    await resetDb();
    // Create a test user and store the ID for later use
    const [user] = await db.insert(users).values({
      email: "asdf@asdf.com",
    }).returning();
    testUserId = user.id;
  });
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

  it("post /jobs creates a job", async () => {
    const response = await client.api.jobs.$post({
      json: { definitionNL, userId: testUserId },
    });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.definitionNL).toBe(definitionNL);
      createdId = json.id;
    }
  });

  it("get /jobs lists all jobs", async () => {
    const response = await client.api.jobs.$get({ query: {} });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.some(j => j.id === createdId && j.definitionNL === definitionNL)).toBe(true);
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

  it("get /jobs/{id} returns 404 when not found", async () => {
    const response = await client.api.jobs[":id"].$get({ param: { id: "11111111-1111-1111-1111-111111111111" } });
    expect(response.status).toBe(404);
    if (response.status === 404) {
      const json = await response.json();
      expect(json.message).toBe(HttpStatusPhrases.NOT_FOUND);
    }
  });

  it("get /jobs/{id} gets a single job", async () => {
    const response = await client.api.jobs[":id"].$get({ param: { id: createdId } });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.definitionNL).toBe(definitionNL);
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

  it("delete /jobs/{id} deletes a job", async () => {
    const response = await client.api.jobs[":id"].$delete({ param: { id: createdId } });
    expect(response.status).toBe(204);
  });

  // Additional tests for pagination, sorting, filtering
  describe("get /jobs with pagination, sorting, filtering", () => {
    let ids: string[];
    beforeAll(async () => {
      await resetDb();
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
      const response = await client.api.jobs.$get({ query: { page: "1", pageSize: "2" } });
      expect(response.status).toBe(200);
      const list = await response.json();
      expect(list).toHaveLength(2);
      expect(list[0].definitionNL).toBe("A-job");
      expect(list[1].definitionNL).toBe("B-job");
    });

    it("sorts results by createdAt desc", async () => {
      const response = await client.api.jobs.$get({ query: { sortBy: "createdAt", sortDirection: "desc" } });
      expect(response.status).toBe(200);
      const list = await response.json();
      expect(list[0].definitionNL).toBe("C-job");
      expect(list[2].definitionNL).toBe("A-job");
    });

    it("filters results by status", async () => {
      const response = await client.api.jobs.$get({ query: { status: "ACTIVE" } });
      expect(response.status).toBe(200);
      const list = await response.json();
      expect(list.length).toBe(1);
      expect(list[0].status).toBe("ACTIVE");
    });
  });
});
