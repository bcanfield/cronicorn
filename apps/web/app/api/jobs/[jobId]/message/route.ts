import { validateApiKey, validateJobAccess } from "@/lib/auth-middleware";
import { prisma } from "@cronicorn/database";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
	const { jobId } = await params;

	// Validate API key
	const authResult = await validateApiKey(request);
	if (!authResult.success || !authResult.user) {
		return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode || 401 });
	}

	// Validate job access
	const jobResult = await validateJobAccess(authResult.user.id, jobId);
	if (!jobResult.success) {
		return NextResponse.json({ error: jobResult.error }, { status: jobResult.statusCode || 404 });
	}

	// Parse the request body
	const body = await request.json();

	await prisma.message.create({
		data: {
			jobId: jobId,
			content: JSON.stringify(body),
			role: "user",
		},
	});

	return NextResponse.json({
		success: true,
	});
}
