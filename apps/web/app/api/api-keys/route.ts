import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-wrapper";

import { randomBytes } from "crypto";
import { prisma } from "@cronicorn/database";

export async function GET() {
	try {
		const session = await getSession();

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const apiKeys = await prisma.apiKey.findMany({
			where: { userId: user.id },
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json(apiKeys);
	} catch (error) {
		console.error("Error fetching API keys:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getSession();

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { name } = await request.json();

		if (!name || typeof name !== "string") {
			return NextResponse.json({ error: "Name is required" }, { status: 400 });
		}

		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Generate a secure API key
		const apiKey = `ak_${randomBytes(32).toString("hex")}`;

		const newApiKey = await prisma.apiKey.create({
			data: {
				name,
				key: apiKey,
				userId: user.id,
			},
		});

		return NextResponse.json(newApiKey);
	} catch (error) {
		console.error("Error creating API key:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
