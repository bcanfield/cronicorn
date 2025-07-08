import type { NextRequest } from "next/server";
import { PrismaClient, type User } from "@cronicorn/database";

const prisma = new PrismaClient();

export interface AuthenticatedUser {
	id: string;
	email: string;
}

export interface AuthResult {
	success: boolean;
	user?: User;
	error?: string;
	statusCode?: number;
}

export async function validateApiKey(request: NextRequest): Promise<AuthResult> {
	try {
		// Extract API key from multiple possible headers
		const apiKey =
			request.headers.get("authorization")?.replace("Bearer ", "") ||
			request.headers.get("x-api-key") ||
			request.headers.get("api-key");

		if (!apiKey) {
			return {
				success: false,
				error: "API key is required",
				statusCode: 401,
			};
		}

		// Validate API key and get user
		const user = await prisma.user.findFirst({
			where: {
				apiKeys: {
					some: {
						key: apiKey,
					},
				},
			},
		});

		if (!user) {
			return {
				success: false,
				error: "Invalid or expired API key",
				statusCode: 401,
			};
		}

		return {
			success: true,
			user,
		};
	} catch (error) {
		console.error("API key validation error:", error);
		return {
			success: false,
			error: "Authentication service error",
			statusCode: 500,
		};
	}
}

export async function validateJobAccess(
	userId: string,
	jobId: string,
): Promise<{ success: boolean; job?: any; error?: string; statusCode?: number }> {
	try {
		const job = await prisma.job.findFirst({
			where: {
				id: jobId,
				userId: userId,
			},
		});

		if (!job) {
			return {
				success: false,
				error: "Job not found or access denied",
				statusCode: 404,
			};
		}

		return {
			success: true,
			job,
		};
	} catch (error) {
		console.error("Job access validation error:", error);
		return {
			success: false,
			error: "Job validation service error",
			statusCode: 500,
		};
	} finally {
		await prisma.$disconnect();
	}
}
