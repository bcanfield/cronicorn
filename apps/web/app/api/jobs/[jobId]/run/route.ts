import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@cronicorn/database";
import { lockAndRunJob } from "@/lib/lock-and-run-job";
import { generateId, type UIMessage } from "@cronicorn/agent";
import { getSession } from "@/lib/auth-wrapper";

interface RouteParams {
	jobId: string;
}

export async function POST(_request: NextRequest, { params }: { params: Promise<RouteParams> }) {
	const { jobId } = await params;
	// Get the session to verify user identity
	const session = await getSession();

	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const job = await prisma.job.findFirst({
			where: {
				id: jobId,
				userId: session.user.id,
			},
		});

		if (!job) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}

		const message: UIMessage = {
			id: generateId(),
			role: "system",
			parts: [{ type: "text", text: `Job Triggered via API` }],
		};
		await lockAndRunJob({ jobId, messages: [message] });

		// Here you would implement the actual job execution logic
		// For now, we'll just update the nextRunAt field

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error running job:", error);
		return NextResponse.json({ error: "Failed to run job" }, { status: 500 });
	}
}
