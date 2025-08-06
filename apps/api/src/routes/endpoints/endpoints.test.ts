/* eslint-disable ts/ban-ts-comment */

import { testClient } from "hono/testing";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { beforeAll, describe, expect, it } from "vitest";

import db from "@/api/db";
import resetDb from "@/api/db/reset";
import { users } from "@/api/db/schema";
import { endpoints as endpointsTable } from "@/api/db/schema/endpoints";
import { jobs } from "@/api/db/schema/jobs";
import env from "@/api/env";
import { ZOD_ERROR_CODES } from "@/api/lib/constants";
import createApp from "@/api/lib/create-app";
import { DEV_USER } from "@/api/lib/dev-user";

import router from "./endpoints.index";

if (env.NODE_ENV !== "test") {
  throw new Error("NODE_ENV must be 'test'");
}

// @ts-ignore: deep type instantiation
const client = testClient(createApp().route("/", router));

describe("endpoints routes", () => {
  let jobId: string;
  let createdId: string;
  let testUserId: string;
  const testName = "Test Endpoint";
  const testUrl = "http://example.com";

  beforeAll(async () => {
    await resetDb();

    const [user] = await db.insert(users).values({ email: "test@jobs.com" }).returning();
    testUserId = user.id;
    // Create a job for endpoints to reference
    const [job] = await db.insert(jobs).values({ definitionNL: "Job for endpoints", userId: DEV_USER.id }).returning();
    jobId = job.id;
  });

  it("post /endpoints validates the body when creating", async () => {
    const response = await client.api.endpoints.$post({
      // @ts-expect-error
      json: {},
    });
    expect(response.status).toBe(422);
    if (response.status === 422) {
      const json = await response.json();
      expect(json.error.issues[0].path[0]).toBe("name");
    }
  });

  it("post /endpoints creates an endpoint", async () => {
    const payload = { name: testName, url: testUrl, jobId };
    const response = await client.api.endpoints.$post({ json: payload });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.name).toBe(testName);
      expect(json.url).toBe(testUrl);
      createdId = json.id;
    }
  });

  it("get /endpoints lists all endpoints", async () => {
    const response = await client.api.endpoints.$get({ query: {} });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const { items, hasNext } = await response.json();
      expect(Array.isArray(items)).toBe(true);
      expect(items.some(e => e.id === createdId && e.name === testName)).toBe(true);
      expect(hasNext).toBe(false);
    }
  });

  it("get /endpoints/{id} validates the id param", async () => {
    const response = await client.api.endpoints[":id"].$get({
      // @ts-expect-error: invalid id type
      param: { id: 123 },
    });
    expect(response.status).toBe(422);
  });

  it("get /endpoints/{id} returns the endpoint", async () => {
    const response = await client.api.endpoints[":id"].$get({ param: { id: createdId } });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.id).toBe(createdId);
    }
  });

  it("patch /endpoints/{id} validates empty body", async () => {
    const response = await client.api.endpoints[":id"].$patch({ param: { id: createdId }, json: {} });
    expect(response.status).toBe(422);
    if (response.status === 422) {
      const json = await response.json();
      expect(json.error.issues[0].code).toBe(ZOD_ERROR_CODES.INVALID_UPDATES);
    }
  });

  it("patch /endpoints/{id} updates a property", async () => {
    const newName = "Updated Endpoint";
    const response = await client.api.endpoints[":id"].$patch({ param: { id: createdId }, json: { name: newName } });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.name).toBe(newName);
    }
  });

  it("delete /endpoints/{id} deletes an endpoint", async () => {
    const response = await client.api.endpoints[":id"].$delete({ param: { id: createdId } });
    expect(response.status).toBe(204);
  });

  it("get /endpoints/{id} returns 404 when not found", async () => {
    const response = await client.api.endpoints[":id"].$get({ param: { id: "11111111-1111-1111-1111-111111111111" } });
    expect(response.status).toBe(404);
    if (response.status === 404) {
      const json = await response.json();
      expect(json.message).toBe(HttpStatusPhrases.NOT_FOUND);
    }
  });

  it("patch /endpoints/{id} returns 404 when updating non-existent endpoint", async () => {
    const nonExistentId = "11111111-1111-1111-1111-111111111111";
    const response = await client.api.endpoints[":id"].$patch({ param: { id: nonExistentId }, json: { name: testName } });
    expect(response.status).toBe(404);
    if (response.status === 404) {
      const json = await response.json();
      expect(json.message).toBe(HttpStatusPhrases.NOT_FOUND);
    }
  });

  it("delete /endpoints/{id} returns 404 when deleting non-existent endpoint", async () => {
    const nonExistentId = "11111111-1111-1111-1111-111111111111";
    const response = await client.api.endpoints[":id"].$delete({ param: { id: nonExistentId } });
    expect(response.status).toBe(404);
    if (response.status === 404) {
      const json = await response.json();
      expect(json.message).toBe(HttpStatusPhrases.NOT_FOUND);
    }
  });

  describe("get /endpoints with pagination, sorting, filtering", () => {
    let ids: string[];
    beforeAll(async () => {
      // Seed three endpoints
      ids = [];
      for (const name of ["A-endpoint", "B-endpoint", "C-endpoint"]) {
        const response = await client.api.endpoints.$post({ json: { name, url: `${testUrl}/${name}`, jobId } });
        expect(response.status).toBe(200);
        if (response.status === 200) {
          const json = await response.json();
          ids.push(json.id);
        }
      }
    });

    it("paginates results", async () => {
      const response = await client.api.endpoints.$get({ query: { page: 1, pageSize: 2 } });
      expect(response.status).toBe(200);
      if (response.status === 200) {
        const { items, hasNext } = await response.json();
        expect(items).toHaveLength(2);
        expect(items[0].name).toBe("C-endpoint");
        expect(items[1].name).toBe("B-endpoint");
        expect(hasNext).toBe(true);
      }
    });

    it("sorts results by createdAt desc", async () => {
      const response = await client.api.endpoints.$get({ query: { sortBy: "createdAt", sortDirection: "desc" } });
      expect(response.status).toBe(200);
      if (response.status === 200) {
        const { items } = await response.json();
        expect(items[0].name).toBe("C-endpoint");
        expect(items[2].name).toBe("A-endpoint");
      }
    });

    it("sorts results by createdAt asc", async () => {
      const response = await client.api.endpoints.$get({ query: { sortBy: "createdAt", sortDirection: "asc" } });
      expect(response.status).toBe(200);
      if (response.status === 200) {
        const { items } = await response.json();
        expect(items[0].name).toBe("A-endpoint");
        expect(items[2].name).toBe("C-endpoint");
      }
    });

    it("filters results by searchQuery", async () => {
      const response = await client.api.endpoints.$get({ query: { searchQuery: "B-endpoint" } });
      expect(response.status).toBe(200);
      if (response.status === 200) {
        const { items, hasNext } = await response.json();
        expect(items).toHaveLength(1);
        expect(items[0].name).toBe("B-endpoint");
        expect(hasNext).toBe(false);
      }
    });

    it("handles invalid sortBy gracefully", async () => {
      // @ts-expect-error: testing invalid sortBy
      const response = await client.api.endpoints.$get({ query: { sortBy: "INVALID", sortDirection: "asc" } });
      expect(response.status).toBe(422);
    });
  });

  it("returns 404 when fetching an endpoint for a job not owned by DEV_USER", async () => {
    const [{ id: otherJobId }] = await db.insert(jobs)
      .values({ definitionNL: "Other Job", userId: testUserId })
      .returning();
    // seed an endpoint under that job
    const [{ id: otherEndpointId }] = await db.insert(endpointsTable)
      .values({ name: "Other Endpoint", url: "http://other", jobId: otherJobId })
      .returning();
    const response = await client.api.endpoints[":id"].$get({ param: { id: otherEndpointId } });
    expect(response.status).toBe(404);
  });
  it("returns 404 when updating an endpoint for a job not owned by DEV_USER", async () => {
    const [{ id: otherJobId }] = await db.insert(jobs)
      .values({ definitionNL: "Other Job 2", userId: testUserId })
      .returning();
    const [{ id: otherEndpointId }] = await db.insert(endpointsTable)
      .values({ name: "Other Endpoint 2", url: "http://other2", jobId: otherJobId })
      .returning();
    const response = await client.api.endpoints[":id"].$patch({ param: { id: otherEndpointId }, json: { name: "X" } });
    expect(response.status).toBe(404);
  });
  it("returns 404 when deleting an endpoint for a job not owned by DEV_USER", async () => {
    const [{ id: otherJobId }] = await db.insert(jobs)
      .values({ definitionNL: "Other Job 3", userId: testUserId })
      .returning();
    const [{ id: otherEndpointId }] = await db.insert(endpointsTable)
      .values({ name: "Other Endpoint 3", url: "http://other3", jobId: otherJobId })
      .returning();
    const response = await client.api.endpoints[":id"].$delete({ param: { id: otherEndpointId } });
    expect(response.status).toBe(404);
  });
  it("returns 404 when creating an endpoint for a job not owned by DEV_USER", async () => {
    const [{ id: otherJobId }] = await db.insert(jobs)
      .values({ definitionNL: "Unauthorized Job", userId: testUserId })
      .returning();
    const payload = { name: "New Endpoint", url: "http://new", jobId: otherJobId };
    const response = await client.api.endpoints.$post({ json: payload });
    expect(response.status).toBe(404);
  });
  it("returns 404 when patching an endpoint for a job not owned by DEV_USER", async () => {
    const [{ id: otherJob2 }] = await db.insert(jobs)
      .values({ definitionNL: "Another Unauthorized Job", userId: testUserId })
      .returning();
    const [{ id: endpointId }] = await db.insert(endpointsTable)
      .values({ name: "Endpoint2", url: "http://ep2", jobId: otherJob2 })
      .returning();
    const response = await client.api.endpoints[":id"].$patch({ param: { id: endpointId }, json: { name: "X" } });
    expect(response.status).toBe(404);
  });
});
