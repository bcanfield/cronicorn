/* eslint-disable ts/ban-ts-comment */

import { testClient } from "hono/testing";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { beforeAll, describe, expect, it } from "vitest";
import { ZodIssueCode } from "zod";

import db from "@/api/db";
import resetDb from "@/api/db/reset";
import { users } from "@/api/db/schema/auth";
import env from "@/api/env";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "@/api/lib/constants";
import createApp from "@/api/lib/create-app";

import router from "./api-keys.index";

if (env.NODE_ENV !== "test") {
  throw new Error("NODE_ENV must be 'test'");
}

const client = testClient(createApp().route("/", router));

describe("api keys routes", () => {
  let createdId: string;
  let testUserId: string;
  const apiKeyName = "Test API Key";
  const apiKeyDescription = "For testing purposes";

  // Seed a test user for all API key tests
  beforeAll(async () => {
    await resetDb();
    const [user] = await db.insert(users).values({ email: "test@api-keys.com" }).returning();
    testUserId = user.id;
  });

  // == Validation Tests ==
  it("post /api-keys validates the body when creating", async () => {
    const response = await client.api["api-keys"].$post({
      // @ts-expect-error
      json: {},
    });
    expect(response.status).toBe(422);
    if (response.status === 422) {
      const json = await response.json();
      expect(json.error.issues[0].path[0]).toBe("name");
      expect(json.error.issues[0].message).toBe(ZOD_ERROR_MESSAGES.REQUIRED);
    }
  });

  // == Creation Tests ==
  it("post /api-keys creates an API key", async () => {
    const payload = { name: apiKeyName, description: apiKeyDescription };
    const response = await client.api["api-keys"].$post({ json: payload });

    expect(response.status).toBe(201);
    if (response.status === 201) {
      const json = await response.json();
      expect(json.name).toBe(apiKeyName);
      expect(json.description).toBe(apiKeyDescription);
      expect(json.key).toBeDefined();
      expect(json.secret).toBeDefined(); // Secret is only returned on creation
      expect(json.revoked).toBe(false);
      createdId = json.id;
    }
  });

  // == Retrieval Tests ==
  it("get /api-keys lists all API keys", async () => {
    const response = await client.api["api-keys"].$get({ query: {} });

    expect(response.status).toBe(200);
    if (response.status === 200) {
      const { items, hasNext } = await response.json();
      expect(Array.isArray(items)).toBe(true);
      expect(items.some(key => key.id === createdId && key.name === apiKeyName)).toBe(true);
      // Secrets should not be returned in list responses
      expect("secret" in items[0]).toBe(false);
      expect(hasNext).toBe(false);
    }
  });

  it("get /api-keys/{id} validates the id param", async () => {
    const response = await client.api["api-keys"][":id"].$get({
      param: {
        // @ts-expect-error: Invalid ID type
        id: 123,
      },
    });
    expect(response.status).toBe(422);
    if (response.status === 422) {
      const json = await response.json();
      expect(json.error.issues[0].path[0]).toBe("id");
    }
  });

  it("get /api-keys/{id} returns a specific API key", async () => {
    const response = await client.api["api-keys"][":id"].$get({ param: { id: createdId } });

    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.id).toBe(createdId);
      expect(json.name).toBe(apiKeyName);
      // Secret should not be returned on retrieval
      expect("secret" in json).toBe(false);
    }
  });

  // == Update Tests ==
  it("patch /api-keys/{id} validates empty body", async () => {
    const response = await client.api["api-keys"][":id"].$patch({
      param: { id: createdId },
      json: {},
    });

    expect(response.status).toBe(422);
    if (response.status === 422) {
      const json = await response.json();
      expect(json.error.issues[0].code).toBe(ZOD_ERROR_CODES.INVALID_UPDATES);
    }
  });

  it("patch /api-keys/{id} updates API key metadata", async () => {
    const updatedName = "Updated API Key";
    const response = await client.api["api-keys"][":id"].$patch({
      param: { id: createdId },
      json: { name: updatedName },
    });

    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.name).toBe(updatedName);
      expect(json.description).toBe(apiKeyDescription);
      // Secret should not be returned on update
      expect("secret" in json).toBe(false);
    }
  });

  // == Revoke Tests ==
  it("post /api-keys/{id}/revoke revokes an API key", async () => {
    const response = await client.api["api-keys"][":id"].revoke.$post({
      param: { id: createdId },
    });

    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.revoked).toBe(true);
    }
  });

  // == Delete Tests ==
  it("delete /api-keys/{id} deletes an API key", async () => {
    const response = await client.api["api-keys"][":id"].$delete({
      param: { id: createdId },
    });

    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.success).toBe(true);

      // Verify deletion - attempt to fetch should return 404
      const checkResponse = await client.api["api-keys"][":id"].$get({
        param: { id: createdId },
      });
      expect(checkResponse.status).toBe(404);
    }
  });
});
