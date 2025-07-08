import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-wrapper";

import { prisma } from "@cronicorn/database";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
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

		// Verify the API key belongs to the user
		const apiKey = await prisma.apiKey.findFirst({
			where: {
				id: id,
				userId: user.id,
			},
		});

		if (!apiKey) {
			return NextResponse.json({ error: "API key not found" }, { status: 404 });
		}

		await prisma.apiKey.delete({
			where: { id: id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting API key:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
