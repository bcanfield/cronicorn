import { getSession } from "@/lib/auth-wrapper";

import { type NextRequest, NextResponse } from "next/server";
import { type Endpoint, type Job, prisma } from "@cronicorn/database";

interface RouteParams {
	jobId: string;
}

type returnType = Promise<
	| NextResponse<{
			error: string;
	  }>
	| NextResponse<Job & { endpoints: Endpoint[] }>
>;

export async function GET(_request: NextRequest, { params }: { params: Promise<RouteParams> }): returnType {
	const { jobId } = await params;
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
			include: {
				endpoints: true,
			},
		});

		if (!job) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}

		return NextResponse.json(job);
	} catch (_error) {
		return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
	}
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
	const { jobId } = await params;
	const session = await getSession();

	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();

		const job = await prisma.job.updateMany({
			where: {
				id: jobId,
				userId: session.user.id,
			},
			data: body,
		});

		if (job.count === 0) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch (_error) {
		return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
	}
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<RouteParams> }) {
	const { jobId } = await params;
	const session = await getSession();

	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const job = await prisma.job.deleteMany({
			where: {
				id: jobId,
				userId: session.user.id,
			},
		});

		if (job.count === 0) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch (_error) {
		return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
	}
}
