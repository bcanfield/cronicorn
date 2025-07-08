"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth-wrapper";

import { randomBytes } from "crypto";
import { prisma } from "@cronicorn/database";

export async function createApiKey(formData: FormData) {
	const session = await getSession();

	if (!session?.user?.email) {
		throw new Error("Unauthorized");
	}

	const name = formData.get("name") as string;
	const userId = formData.get("userId") as string;

	if (!name || typeof name !== "string") {
		throw new Error("Name is required");
	}

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
	});

	if (!user || user.id !== userId) {
		throw new Error("User not found or unauthorized");
	}

	// Generate a secure API key
	const apiKey = `ak_${randomBytes(32).toString("hex")}`;

	await prisma.apiKey.create({
		data: {
			name,
			key: apiKey,
			userId: user.id,
		},
	});

	revalidatePath("/dashboard");
}

export async function deleteApiKey(formData: FormData) {
	const session = await getSession();

	if (!session?.user?.email) {
		throw new Error("Unauthorized");
	}

	const keyId = formData.get("keyId") as string;

	if (!keyId) {
		throw new Error("Key ID is required");
	}

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
	});

	if (!user) {
		throw new Error("User not found");
	}

	// Verify the API key belongs to the user
	const apiKey = await prisma.apiKey.findFirst({
		where: {
			id: keyId,
			userId: user.id,
		},
	});

	if (!apiKey) {
		throw new Error("API key not found or unauthorized");
	}

	await prisma.apiKey.delete({
		where: { id: keyId },
	});

	revalidatePath("/dashboard");
}
