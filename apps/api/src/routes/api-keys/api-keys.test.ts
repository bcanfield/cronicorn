import { describe, expect, it } from "vitest";

import { apiKeys } from "@/api/db/schema";
import { testClient } from "@/api/lib/test-utils";
import { apiKeyFactory, userFactory } from "@/api/test/factories";
import { createMockAuthUser } from "@/api/test/mocks";

describe("aPI Keys Routes", () => {
    describe("gET /api-keys", () => {
        it("should return a list of API keys for the authenticated user", async () => {
            // Setup - Create a user and API keys for them
            const user = userFactory.create();
            const keys = [
                apiKeyFactory.create({ userId: user.id }),
                apiKeyFactory.create({ userId: user.id }),
            ];

            // Act - Make request with authenticated user
            const res = await testClient
                .app
                .request("/api-keys", {
                    headers: createMockAuthUser(user),
                });

            // Assert
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.items).toHaveLength(keys.length);
            expect(body.items[0].id).toBeDefined();
            // Should not expose secret in response
            expect(body.items[0].secret).toBeUndefined();
        });

        it("should only return API keys for the authenticated user", async () => {
            // Setup - Create two users with their own API keys
            const user1 = userFactory.create();
            const user2 = userFactory.create();
            apiKeyFactory.create({ userId: user1.id });
            apiKeyFactory.create({ userId: user2.id });

            // Act - Make request with user1
            const res = await testClient
                .app
                .request("/api-keys", {
                    headers: createMockAuthUser(user1),
                });

            // Assert
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.items).toHaveLength(1);
            expect(body.items[0].userId).toBe(user1.id);
        });
    });

    describe("pOST /api-keys", () => {
        it("should create a new API key for the authenticated user", async () => {
            // Setup
            const user = userFactory.create();
            const apiKeyData = {
                name: "Test API Key",
                description: "For testing purposes",
            };

            // Act
            const res = await testClient
                .app
                .request("/api-keys", {
                    method: "POST",
                    headers: {
                        ...createMockAuthUser(user),
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(apiKeyData),
                });

            // Assert
            expect(res.status).toBe(201);
            const body = await res.json();
            expect(body.name).toBe(apiKeyData.name);
            expect(body.description).toBe(apiKeyData.description);
            expect(body.userId).toBe(user.id);
            expect(body.key).toBeDefined();
            expect(body.secret).toBeDefined();
            expect(body.revoked).toBe(false);
        });
    });

    describe("gET /api-keys/{id}", () => {
        it("should return a specific API key by ID for the authenticated user", async () => {
            // Setup
            const user = userFactory.create();
            const apiKey = apiKeyFactory.create({ userId: user.id });

            // Act
            const res = await testClient
                .app
                .request(`/api-keys/${apiKey.id}`, {
                    headers: createMockAuthUser(user),
                });

            // Assert
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.id).toBe(apiKey.id);
            expect(body.userId).toBe(user.id);
            // Should not expose secret in response
            expect(body.secret).toBeUndefined();
        });

        it("should return 404 if API key doesn't belong to authenticated user", async () => {
            // Setup - Create two users and give an API key to user1
            const user1 = userFactory.create();
            const user2 = userFactory.create();
            const apiKey = apiKeyFactory.create({ userId: user1.id });

            // Act - Try to access user1's API key as user2
            const res = await testClient
                .app
                .request(`/api-keys/${apiKey.id}`, {
                    headers: createMockAuthUser(user2),
                });

            // Assert
            expect(res.status).toBe(404);
        });
    });

    describe("pATCH /api-keys/{id}", () => {
        it("should update an API key's metadata", async () => {
            // Setup
            const user = userFactory.create();
            const apiKey = apiKeyFactory.create({ userId: user.id, name: "Original Name" });
            const updates = { name: "Updated Name" };

            // Act
            const res = await testClient
                .app
                .request(`/api-keys/${apiKey.id}`, {
                    method: "PATCH",
                    headers: {
                        ...createMockAuthUser(user),
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updates),
                });

            // Assert
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.name).toBe(updates.name);
            // Key and secret should remain unchanged
            expect(body.key).toBe(apiKey.key);
            expect(body.secret).toBeUndefined(); // Secret should not be returned
        });

        it("should not allow updating key or secret directly", async () => {
            // Setup
            const user = userFactory.create();
            const apiKey = apiKeyFactory.create({
                userId: user.id,
                key: "original-key",
                secret: "original-secret",
            });
            const updates = {
                name: "Updated Name",
                key: "hacked-key",
                secret: "hacked-secret",
            };

            // Act
            const res = await testClient
                .app
                .request(`/api-keys/${apiKey.id}`, {
                    method: "PATCH",
                    headers: {
                        ...createMockAuthUser(user),
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updates),
                });

            // Assert
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.name).toBe(updates.name);
            // Key should remain unchanged despite attempt to update
            expect(body.key).toBe(apiKey.key);
            // Secret should not be exposed in response
            expect(body.secret).toBeUndefined();
        });
    });

    describe("pOST /api-keys/{id}/revoke", () => {
        it("should revoke an API key", async () => {
            // Setup
            const user = userFactory.create();
            const apiKey = apiKeyFactory.create({ userId: user.id, revoked: false });

            // Act
            const res = await testClient
                .app
                .request(`/api-keys/${apiKey.id}/revoke`, {
                    method: "POST",
                    headers: createMockAuthUser(user),
                });

            // Assert
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.revoked).toBe(true);
        });
    });

    describe("dELETE /api-keys/{id}", () => {
        it("should delete an API key", async () => {
            // Setup
            const user = userFactory.create();
            const apiKey = apiKeyFactory.create({ userId: user.id });

            // Act
            const res = await testClient
                .app
                .request(`/api-keys/${apiKey.id}`, {
                    method: "DELETE",
                    headers: createMockAuthUser(user),
                });

            // Assert
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.success).toBe(true);

            // Verify API key was deleted
            const deletedKey = await testClient.db.query.apiKeys.findFirst({
                where: (fields, { eq }) => eq(fields.id, apiKey.id),
            });
            expect(deletedKey).toBeUndefined();
        });
    });
});
