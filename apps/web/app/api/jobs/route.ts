import { getSession } from "@/lib/auth-wrapper";

import { type NextRequest, NextResponse } from "next/server";
import { JobStatus, prisma } from "@cronicorn/database";

export async function GET() {
	const session = await getSession();

	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const jobs = await prisma.job.findMany({
			where: {
				userId: session.user.id,
			},
			orderBy: {
				updatedAt: "desc",
			},
		});

		return NextResponse.json(jobs);
	} catch (_error) {
		return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	const session = await getSession();

	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { definitionNL, status } = body;

		const job = await prisma.job.create({
			data: {
				definitionNL,
				status: status || JobStatus.PAUSED,
				userId: session.user.id,
			},
		});

		return NextResponse.json(job);
	} catch (error) {
		console.error("Error creating job:", error);
		return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
	}
}
