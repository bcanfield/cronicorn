/* eslint-disable ts/ban-ts-comment */
import { testClient } from "hono/testing";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { beforeAll, describe, expect, it } from "vitest";
import { ZodIssueCode } from "zod";

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
  const definitionNL = "Test job definition";

  beforeAll(async () => {
    await resetDb();
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
      json: { definitionNL },
    });
    expect(response.status).toBe(200);
    if (response.status === 200) {
      const json = await response.json();
      expect(json.definitionNL).toBe(definitionNL);
      createdId = json.id;
    }
  });

  it("get /jobs lists all jobs", async () => {
    const response = await client.api.jobs.$get();
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
});
