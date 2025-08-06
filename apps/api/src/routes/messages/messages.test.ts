/* eslint-disable ts/ban-ts-comment */

import { testClient } from "hono/testing";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { beforeAll, describe, expect, it } from "vitest";

import type { insertMessagesSchema } from "@/api/db/schema/messages";

import db from "@/api/db";
import resetDb from "@/api/db/reset";
import { users } from "@/api/db/schema";
import { jobs } from "@/api/db/schema/jobs";
import { messages as messagesTable } from "@/api/db/schema/messages";
import env from "@/api/env";
import { ZOD_ERROR_CODES } from "@/api/lib/constants";
import createApp from "@/api/lib/create-app";
import { DEV_USER } from "@/api/lib/dev-user";

import router from "./messages.index";

if (env.NODE_ENV !== "test") {
  throw new Error("NODE_ENV must be 'test'");
}

// @ts-ignore: deep type instantiation
const client = testClient(createApp().route("/", router));

describe("messages routes", () => {
  let jobId: string;
  let createdId: string;
  let testUserId: string;
  const testRole: insertMessagesSchema["role"] = "user";
  const testContent = "Hello, world!";

  beforeAll(async () => {
    await resetDb();

    const [user] = await db.insert(users).values({ email: "test@messages.com" }).returning();
    testUserId = user.id;
    // Create a job for messages to reference
    const [job] = await db.insert(jobs).values({ definitionNL: "Job for messages", userId: DEV_USER.id }).returning();
    jobId = job.id;
  });

  it("post /messages validates the body when creating", async () => {
    const response = await client.api.messages.$post({
      // @ts-expect-error
      json: {},
    });
    expect(response.status).toBe(422);
    if (response.status === 422) {
      const json = await response.json();
      expect(json.error.issues[0].path[0]).toBe("role");
    }
  });

  it("post /messages creates a message", async () => {
    const payload = { role: testRole, content: testContent, jobId };
    const response = await client.api.messages.$post({ json: payload });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.role).toBe(testRole);
      expect(json.content).toEqual(testContent);
      createdId = json.id;
    }
  });

  it("get /messages lists all messages", async () => {
    const response = await client.api.messages.$get({ query: {}, param: { jobId } });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const { items, hasNext } = await response.json();
      expect(Array.isArray(items)).toBe(true);
      expect(items.some(m => m.id === createdId && m.role === testRole)).toBe(true);
      expect(hasNext).toBe(false);
    }
  });

  it("get /messages/{id} validates the id param", async () => {
    const response = await client.api.messages[":id"].$get({
      // @ts-expect-error: invalid id type
      param: { id: 123 },
    });
    expect(response.status).toBe(422);
  });

  it("get /messages/{id} returns the message", async () => {
    const response = await client.api.messages[":id"].$get({ param: { id: createdId } });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.id).toBe(createdId);
    }
  });

  it("patch /messages/{id} validates empty body", async () => {
    // @ts-expect-error: empty body
    const response = await client.api.messages[":id"].$patch({ param: { id: createdId }, json: { jobId } });
    expect(response.status).toBe(422);
    if (response.status === 422) {
      const json = await response.json();
      expect(json.error.issues[0].code).toBe(ZOD_ERROR_CODES.INVALID_LITERAL);
    }
  });

  it("patch /messages/{id} updates a property", async () => {
    const newRole = "user";
    const response = await client.api.messages[":id"].$patch({ param: { id: createdId }, json: { jobId, role: newRole, content: "Test Content" } });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.role).toBe(newRole);
    }
  });

  it("delete /messages/{id} deletes a message", async () => {
    const response = await client.api.messages[":id"].$delete({ param: { id: createdId } });
    expect(response.status).toBe(204);
  });

  it("get /messages/{id} returns 404 when not found", async () => {
    const response = await client.api.messages[":id"].$get({ param: { id: "11111111-1111-1111-1111-111111111111" } });
    expect(response.status).toBe(404);
    if (response.status === 404) {
      const json = await response.json();
      expect(json.message).toBe(HttpStatusPhrases.NOT_FOUND);
    }
  });

  it("patch /messages/{id} returns 404 when updating non-existent message", async () => {
    const nonExistentId = "11111111-1111-1111-1111-111111111111";
    const response = await client.api.messages[":id"].$patch({ param: { id: nonExistentId }, json: { role: testRole, jobId, content: "Test Content" } });
    expect(response.status).toBe(404);
    if (response.status === 404) {
      const json = await response.json();
      expect(json.message).toBe(HttpStatusPhrases.NOT_FOUND);
    }
  });

  it("delete /messages/{id} returns 404 when deleting non-existent message", async () => {
    const nonExistentId = "11111111-1111-1111-1111-111111111111";
    const response = await client.api.messages[":id"].$delete({ param: { id: nonExistentId } });
    expect(response.status).toBe(404);
    if (response.status === 404) {
      const json = await response.json();
      expect(json.message).toBe(HttpStatusPhrases.NOT_FOUND);
    }
  });

  describe("get /messages with pagination, sorting, filtering", () => {
    let ids: string[];
    beforeAll(async () => {
      // Seed three messages
      ids = [];
      for (let i = 0; i < 3; i++) {
        const response = await client.api.messages.$post({
          json: {
            role: "user",
            content: `Message ${i + 1}`,
            jobId,
          },
        });
        expect(response.status).toBe(200);
        if (response.status === 200) {
          const json = await response.json();
          ids.push(json.id);
        }
      }
    });

    it("paginates results", async () => {
      const response = await client.api.messages.$get({ query: { page: 1, pageSize: 2 }, param: { jobId } });
      expect(response.status).toBe(200);
      const { items, hasNext } = await response.json();
      expect(items).toHaveLength(2);
      expect(hasNext).toBe(true);
    });

    it("sorts results by createdAt desc", async () => {
      const response = await client.api.messages.$get({ query: { sortBy: "createdAt", sortDirection: "desc" }, param: { jobId } });
      expect(response.status).toBe(200);
      const { items } = await response.json();
      expect(items[0].content).toBe("Message 3");
    });

    it("sorts results by createdAt asc", async () => {
      const response = await client.api.messages.$get({ query: { sortBy: "createdAt", sortDirection: "asc" }, param: { jobId } });
      expect(response.status).toBe(200);
      const { items } = await response.json();
      expect(items[0].content).toBe("Message 1");
    });

    it("filters results by role", async () => {
      const response = await client.api.messages.$get({ query: { searchQuery: "user" }, param: { jobId } });
      expect(response.status).toBe(200);
      const { items, hasNext } = await response.json();
      expect(items).toHaveLength(3);
      expect(items[0].role).toBe("user");
      expect(hasNext).toBe(false);
    });

    it("filters results by jobId", async () => {
      const response = await client.api.messages.$get({ query: {}, param: { jobId } });
      expect(response.status).toBe(200);
      const { items } = await response.json();
      expect(items.length).toBeGreaterThan(0);
      expect(items.every(m => m.jobId === jobId)).toBe(true);
    });

    it("handles invalid sortBy gracefully", async () => {
      // @ts-expect-error: testing invalid sortBy
      const response = await client.api.messages.$get({ query: { sortBy: "INVALID", sortDirection: "asc" } });
      expect(response.status).toBe(422);
    });
  });

  it("returns 404 when fetching a message for a job not owned by DEV_USER", async () => {
    const [{ id: otherJobId }] = await db.insert(jobs)
      .values({ definitionNL: "Other Job", userId: testUserId })
      .returning();
    // seed a message under that job
    const [{ id: otherMessageId }] = await db.insert(messagesTable)
      .values({ role: "user", content: "Hello", jobId: otherJobId })
      .returning();
    const response = await client.api.messages[":id"].$get({ param: { id: otherMessageId } });
    expect(response.status).toBe(404);
  });

  it("returns 404 when updating a message for a job not owned by DEV_USER", async () => {
    const [{ id: otherJobId }] = await db.insert(jobs)
      .values({ definitionNL: "Other Job 2", userId: testUserId })
      .returning();
    const [{ id: otherMessageId }] = await db.insert(messagesTable)
      .values({ role: "user", content: "Hello 2", jobId: otherJobId })
      .returning();
    const response = await client.api.messages[":id"].$patch({
      param: { id: otherMessageId },
      json: { role: "user", content: "Updated content", jobId: otherJobId },
    });
    expect(response.status).toBe(404);
  });

  it("returns 404 when deleting a message for a job not owned by DEV_USER", async () => {
    const [{ id: otherJobId }] = await db.insert(jobs)
      .values({ definitionNL: "Other Job 3", userId: testUserId })
      .returning();
    const [{ id: otherMessageId }] = await db.insert(messagesTable)
      .values({ role: "user", content: "Hello 3", jobId: otherJobId })
      .returning();
    const response = await client.api.messages[":id"].$delete({ param: { id: otherMessageId } });
    expect(response.status).toBe(404);
  });

  it("returns 404 when creating a message for a job not owned by DEV_USER", async () => {
    const [{ id: otherJobId }] = await db.insert(jobs)
      .values({ definitionNL: "Unauthorized Job", userId: testUserId })
      .returning();
    const payload: insertMessagesSchema = { role: "user", content: "New message", jobId: otherJobId };
    const response = await client.api.messages.$post({ json: payload });
    expect(response.status).toBe(404);
  });
});
