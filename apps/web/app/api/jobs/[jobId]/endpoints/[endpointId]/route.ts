import { getSession } from "@/lib/auth-wrapper";

import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@cronicorn/database";

interface RouteParams {
	jobId: string;
	endpointId: string;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
	const session = await getSession();
	const { jobId, endpointId } = await params;

	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		// Verify job ownership
		const job = await prisma.job.findFirst({
			where: {
				id: jobId,
				userId: session.user.id,
			},
		});

		if (!job) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}

		const body = await request.json();

		const endpoint = await prisma.endpoint.updateMany({
			where: {
				id: endpointId,
				jobId: jobId,
			},
			data: body,
		});

		if (endpoint.count === 0) {
			return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch (_error) {
		return NextResponse.json({ error: "Failed to update endpoint" }, { status: 500 });
	}
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<RouteParams> }) {
	const session = await getSession();
	const { jobId, endpointId } = await params;

	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		// Verify job ownership
		const job = await prisma.job.findFirst({
			where: {
				id: jobId,
				userId: session.user.id,
			},
		});

		if (!job) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}

		const endpoint = await prisma.endpoint.deleteMany({
			where: {
				id: endpointId,
				jobId: jobId,
			},
		});

		if (endpoint.count === 0) {
			return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch (_error) {
		return NextResponse.json({ error: "Failed to delete endpoint" }, { status: 500 });
	}
}
