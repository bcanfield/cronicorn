import { getSession } from "@/lib/auth-wrapper";

import { type NextRequest, NextResponse } from "next/server";
import { JobStatus, prisma } from "@cronicorn/database";

export async function POST(request: NextRequest) {
	const session = await getSession();

	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { action, jobIds } = body;

		let updateData: any = {};

		switch (action) {
			case "pause":
				updateData = { status: JobStatus.PAUSED };
				break;
			case "activate":
				updateData = { status: JobStatus.ACTIVE };
				break;
			case "archive":
				updateData = { status: JobStatus.ARCHIVED };
				break;
			case "delete":
				await prisma.job.deleteMany({
					where: {
						id: { in: jobIds },
						userId: session.user.id,
					},
				});
				return NextResponse.json({ success: true });
			default:
				return NextResponse.json({ error: "Invalid action" }, { status: 400 });
		}

		await prisma.job.updateMany({
			where: {
				id: { in: jobIds },
				userId: session.user.id,
			},
			data: updateData,
		});

		return NextResponse.json({ success: true });
	} catch (_error) {
		return NextResponse.json({ error: "Failed to perform bulk action" }, { status: 500 });
	}
}
