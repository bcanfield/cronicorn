import { getSession } from "@/lib/auth-wrapper";

import { type NextRequest, NextResponse } from "next/server";
import { type Endpoint, prisma } from "@cronicorn/database";

interface RouteParams {
	jobId: string;
}

type ReturnType = Promise<
	| NextResponse<{
			error: string;
	  }>
	| NextResponse<{
			endpoint: Endpoint;
	  }>
>;

export async function POST(request: NextRequest, { params }: { params: Promise<RouteParams> }): ReturnType {
	const { jobId } = await params;
	const session = await getSession();

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
		const { name, url, method, bearerToken, requestSchema } = body;

		const endpoint = await prisma.endpoint.create({
			data: {
				name,
				url,
				method,
				bearerToken,
				requestSchema,
				jobId: jobId,
			},
		});

		return NextResponse.json({ endpoint });
	} catch (_error) {
		return NextResponse.json({ error: "Failed to create endpoint" }, { status: 500 });
	}
}
