import { Hono } from "hono";
import { handle as vercelHandle } from "hono/vercel";
import { zValidator } from "@hono/zod-validator";
import { hc, type InferResponseType, type InferRequestType } from "hono/client";
import { cors } from "hono/cors";
import { JobsQuerySchema, MessagesQuerySchema } from "./types";
import { mockJobs, mockMessages, mockMetrics, mockStats } from "./mock-data";

// const app = new Hono().basePath("/api/hono");
const app = new Hono().basePath("/api/hono");

// CORS middleware
app.use("/*", cors());

const jobsRoute = app
	.get("/jobs", zValidator("query", JobsQuerySchema), (c) => {
		const { page, limit, status, search, sortBy, sortOrder } = c.req.valid("query");

		let filteredJobs = [...mockJobs];

		// Apply filters
		if (status) {
			filteredJobs = filteredJobs.filter((job) => job.status === status);
		}

		if (search) {
			filteredJobs = filteredJobs.filter((job) => job.definitionNL.toLowerCase().includes(search.toLowerCase()));
		}

		// Apply sorting
		filteredJobs.sort((a, b) => {
			const aValue = a[sortBy];
			const bValue = b[sortBy];

			if (aValue === null && bValue === null) return 0;
			if (aValue === null) return sortOrder === "asc" ? -1 : 1;
			if (bValue === null) return sortOrder === "asc" ? 1 : -1;

			const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
			return sortOrder === "asc" ? comparison : -comparison;
		});

		// Apply pagination
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

		const response = {
			jobs: paginatedJobs,
			total: filteredJobs.length,
			page,
			limit,
			hasMore: endIndex < filteredJobs.length,
		};

		return c.json(response);
	})
	.get("/jobs/:id", (c) => {
		const id = c.req.param("id");
		const job = mockJobs.find((j) => j.id === id);

		if (!job) {
			return c.json({ error: "Job not found" }, 404);
		}

		return c.json(job);
	});

// Messages routes
const messagesRoute = app
	.get("/messages", zValidator("query", MessagesQuerySchema), (c) => {
		const { page, limit, jobId, role, since } = c.req.valid("query");

		let filteredMessages = [...mockMessages];

		// Apply filters
		if (jobId) {
			filteredMessages = filteredMessages.filter((msg) => msg.jobId === jobId);
		}

		if (role) {
			filteredMessages = filteredMessages.filter((msg) => msg.role === role);
		}

		if (since) {
			const sinceDate = new Date(since);
			filteredMessages = filteredMessages.filter((msg) => new Date(msg.createdAt) >= sinceDate);
		}

		// Sort by createdAt desc
		filteredMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		// Apply pagination
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

		const response = {
			messages: paginatedMessages,
			total: filteredMessages.length,
			page,
			limit,
			hasMore: endIndex < filteredMessages.length,
		};

		return c.json(response);
	})
	.get("/jobs/:id/messages", zValidator("query", MessagesQuerySchema), (c) => {
		const jobId = c.req.param("id");
		const { page, limit, role, since } = c.req.valid("query");

		let filteredMessages = mockMessages.filter((msg) => msg.jobId === jobId);

		// Apply additional filters
		if (role) {
			filteredMessages = filteredMessages.filter((msg) => msg.role === role);
		}

		if (since) {
			const sinceDate = new Date(since);
			filteredMessages = filteredMessages.filter((msg) => new Date(msg.createdAt) >= sinceDate);
		}

		// Sort by createdAt desc
		filteredMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		// Apply pagination
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

		const response = {
			messages: paginatedMessages,
			total: filteredMessages.length,
			page,
			limit,
			hasMore: endIndex < filteredMessages.length,
		};

		return c.json(response);
	});

// Stats and metrics routes
const statsRoute = app
	.get("/stats", (c) => {
		return c.json(mockStats);
	})
	.get("/metrics", (c) => {
		return c.json(mockMetrics);
	});

// Combine all routes
const routes = app.route("/", jobsRoute).route("/", messagesRoute).route("/", statsRoute);
type RestApiType = typeof routes;

export { vercelHandle, app, type RestApiType, hc, type InferResponseType, type InferRequestType };
