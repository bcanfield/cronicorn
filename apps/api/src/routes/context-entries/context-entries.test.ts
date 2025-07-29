/* eslint-disable ts/ban-ts-comment */

import { testClient } from "hono/testing";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { beforeAll, describe, expect, it } from "vitest";

import db from "@/api/db";
import resetDb from "@/api/db/reset";
import { users } from "@/api/db/schema";
import { contextEntries as contextEntriesTable } from "@/api/db/schema/context-entries";
import { jobs } from "@/api/db/schema/jobs";
import env from "@/api/env";
import { ZOD_ERROR_CODES } from "@/api/lib/constants";
import createApp from "@/api/lib/create-app";
import { DEV_USER } from "@/api/lib/dev-user";

import router from "./context-entries.index";

if (env.NODE_ENV !== "test") {
  throw new Error("NODE_ENV must be 'test'");
}

// @ts-ignore: deep type instantiation
const client = testClient(createApp().route("/", router));

describe("context entries routes", () => {
  let jobId: string;
  let createdId: string;
  let testUserId: string;
  const testKey = "test-key";
  const testValue = "test-value";

  beforeAll(async () => {
    await resetDb();

    const [user] = await db.insert(users).values({ email: "test@context-entries.com" }).returning();
    testUserId = user.id;
    // Create a job for context entries to reference
    const [job] = await db.insert(jobs).values({ definitionNL: "Job for context entries", userId: DEV_USER.id }).returning();
    jobId = job.id;
  });

  it("post /context-entries validates the body when creating", async () => {
    const response = await client.api["context-entries"].$post({
      // @ts-expect-error
      json: {},
    });
    expect(response.status).toBe(422);
    if (response.status === 422) {
      const json = await response.json();
      expect(json.error.issues[0].path[0]).toBe("jobId");
    }
  });

  it("post /context-entries creates a context entry", async () => {
    const payload = { key: testKey, value: testValue, jobId };
    const response = await client.api["context-entries"].$post({ json: payload });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.key).toBe(testKey);
      expect(json.value).toBe(testValue);
      createdId = json.id;
    }
  });

  it("get /context-entries lists all context entries", async () => {
    const response = await client.api["context-entries"].$get({ query: {} });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const { items, hasNext } = await response.json();
      expect(Array.isArray(items)).toBe(true);
      expect(items.some(e => e.id === createdId && e.key === testKey)).toBe(true);
      expect(hasNext).toBe(false);
    }
  });

  it("get /context-entries/{id} validates the id param", async () => {
    const response = await client.api["context-entries"][":id"].$get({
      // @ts-expect-error: invalid id type
      param: { id: 123 },
    });
    expect(response.status).toBe(422);
  });

  it("get /context-entries/{id} returns the context entry", async () => {
    const response = await client.api["context-entries"][":id"].$get({ param: { id: createdId } });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.id).toBe(createdId);
    }
  });

  it("patch /context-entries/{id} validates empty body", async () => {
    const response = await client.api["context-entries"][":id"].$patch({ param: { id: createdId }, json: {} });
    expect(response.status).toBe(422);
    if (response.status === 422) {
      const json = await response.json();
      expect(json.error.issues[0].code).toBe(ZOD_ERROR_CODES.INVALID_UPDATES);
    }
  });

  it("patch /context-entries/{id} updates a property", async () => {
    const newKey = "updated-key";
    const response = await client.api["context-entries"][":id"].$patch({ param: { id: createdId }, json: { key: newKey } });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.key).toBe(newKey);
    }
  });

  it("delete /context-entries/{id} deletes a context entry", async () => {
    const response = await client.api["context-entries"][":id"].$delete({ param: { id: createdId } });
    expect(response.status).toBe(204);
  });

  it("get /context-entries/{id} returns 404 when not found", async () => {
    const response = await client.api["context-entries"][":id"].$get({ param: { id: "11111111-1111-1111-1111-111111111111" } });
    expect(response.status).toBe(404);
    if (response.status === 404) {
      const json = await response.json();
      expect(json.message).toBe(HttpStatusPhrases.NOT_FOUND);
    }
  });

  it("patch /context-entries/{id} returns 404 when updating non-existent context entry", async () => {
    const nonExistentId = "11111111-1111-1111-1111-111111111111";
    const response = await client.api["context-entries"][":id"].$patch({ param: { id: nonExistentId }, json: { key: testKey } });
    expect(response.status).toBe(404);
    if (response.status === 404) {
      const json = await response.json();
      expect(json.message).toBe(HttpStatusPhrases.NOT_FOUND);
    }
  });

  it("delete /context-entries/{id} returns 404 when deleting non-existent context entry", async () => {
    const nonExistentId = "11111111-1111-1111-1111-111111111111";
    const response = await client.api["context-entries"][":id"].$delete({ param: { id: nonExistentId } });
    expect(response.status).toBe(404);
    if (response.status === 404) {
      const json = await response.json();
      expect(json.message).toBe(HttpStatusPhrases.NOT_FOUND);
    }
  });

  describe("get /context-entries with pagination, sorting, filtering", () => {
    let ids: string[];
    beforeAll(async () => {
      // Seed three context entries
      ids = [];
      const entries = [
        { key: "A-key", value: "A-value" },
        { key: "B-key", value: "B-value" },
        { key: "C-key", value: "C-value" },
      ];

      for (const entry of entries) {
        const response = await client.api["context-entries"].$post({
          json: { ...entry, jobId },
        });
        expect(response.status).toBe(200);
        if (response.status === 200) {
          const json = await response.json();
          ids.push(json.id);
        }
      }
    });

    it("paginates results", async () => {
      const response = await client.api["context-entries"].$get({ query: { page: 1, pageSize: 2 } });
      expect(response.status).toBe(200);
      const { items, hasNext } = await response.json();
      expect(items).toHaveLength(2);
      expect(hasNext).toBe(true);
    });

    it("sorts results by createdAt desc", async () => {
      const response = await client.api["context-entries"].$get({ query: { sortBy: "createdAt", sortDirection: "desc" } });
      expect(response.status).toBe(200);
      const { items } = await response.json();
      expect(items[0].key).toBe("C-key");
    });

    it("sorts results by createdAt asc", async () => {
      const response = await client.api["context-entries"].$get({ query: { sortBy: "createdAt", sortDirection: "asc" } });
      expect(response.status).toBe(200);
      const { items } = await response.json();
      expect(items[0].key).toBe("A-key");
    });
    it("handles invalid sortBy gracefully", async () => {
      // @ts-expect-error: testing invalid sortBy
      const response = await client.api["context-entries"].$get({ query: { sortBy: "INVALID", sortDirection: "asc" } });
      expect(response.status).toBe(422);
    });

    it("filters results by searchQuery", async () => {
      const response = await client.api["context-entries"].$get({ query: { searchQuery: "B-key" } });
      expect(response.status).toBe(200);
      const { items, hasNext } = await response.json();
      expect(items).toHaveLength(1);
      expect(items[0].key).toBe("B-key");
      expect(hasNext).toBe(false);
    });

    it("filters results by jobId", async () => {
      const response = await client.api["context-entries"].$get({ query: { jobId } });
      expect(response.status).toBe(200);
      const { items } = await response.json();
      expect(items.length).toBeGreaterThan(0);
      expect(items.every(e => e.jobId === jobId)).toBe(true);
    });
  });

  it("returns 404 when fetching a context entry for a job not owned by DEV_USER", async () => {
    const [{ id: otherJobId }] = await db.insert(jobs)
      .values({ definitionNL: "Other Job", userId: testUserId })
      .returning();
    // seed a context entry under that job
    const [{ id: otherEntryId }] = await db.insert(contextEntriesTable)
      .values({ key: "other-key", value: "other-value", jobId: otherJobId })
      .returning();
    const response = await client.api["context-entries"][":id"].$get({ param: { id: otherEntryId } });
    expect(response.status).toBe(404);
  });

  it("returns 404 when updating a context entry for a job not owned by DEV_USER", async () => {
    const [{ id: otherJobId }] = await db.insert(jobs)
      .values({ definitionNL: "Other Job 2", userId: testUserId })
      .returning();
    const [{ id: otherEntryId }] = await db.insert(contextEntriesTable)
      .values({ key: "other-key-2", value: "other-value-2", jobId: otherJobId })
      .returning();
    const response = await client.api["context-entries"][":id"].$patch({
      param: { id: otherEntryId },
      json: { key: "updated-other-key" },
    });
    expect(response.status).toBe(404);
  });

  it("returns 404 when deleting a context entry for a job not owned by DEV_USER", async () => {
    const [{ id: otherJobId }] = await db.insert(jobs)
      .values({ definitionNL: "Other Job 3", userId: testUserId })
      .returning();
    const [{ id: otherEntryId }] = await db.insert(contextEntriesTable)
      .values({ key: "other-key-3", value: "other-value-3", jobId: otherJobId })
      .returning();
    const response = await client.api["context-entries"][":id"].$delete({ param: { id: otherEntryId } });
    expect(response.status).toBe(404);
  });

  it("returns 404 when creating a context entry for a job not owned by DEV_USER", async () => {
    const [{ id: otherJobId }] = await db.insert(jobs)
      .values({ definitionNL: "Unauthorized Job", userId: testUserId })
      .returning();
    const payload = { key: "new-key", value: "new-value", jobId: otherJobId };
    const response = await client.api["context-entries"].$post({ json: payload });
    expect(response.status).toBe(404);
  });
});
