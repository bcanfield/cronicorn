import { NextResponse } from "next/server";
// import { lockAndRunJob } from "@/lib/lock-and-run-job";
// import { generateId } from "@cronicorn/agent";

// export const schedule = "*/1 * * * *"; // every minute

export async function GET() {
	return NextResponse.json({
		message: "Cron job endpoint is active",
		timestamp: new Date().toISOString(),
	});
	// const now = new Date();
	// // 1) Find due, unlocked jobs
	// const due = await prisma.job.findMany({
	// 	where: {
	// 		nextRunAt: { lte: now },
	// 		status: JobStatus.ACTIVE,
	// 		locked: false,
	// 	},
	// 	select: { id: true },
	// });

	// let processed = 0;

	// try {
	// 	await Promise.all(
	// 		due.map(async ({ id }) => {
	// 			lockAndRunJob({
	// 				jobId: id,
	// 				messages: [
	// 					{
	// 						id: generateId(),
	// 						role: "system",
	// 						parts: [{ type: "text", text: `Job Triggered via scheduled cron` }],
	// 						// content: `Job Triggered via API: ${jobId}`,
	// 					},
	// 				],
	// 			});
	// 			processed++;
	// 		}),
	// 	);

	// 	return NextResponse.json({ now, due: due.length, processed });
	// } catch (error) {
	// 	console.error("Error processing jobs:", error);
	// 	return NextResponse.json({ error: "Failed to process jobs" }, { status: 500 });
	// }
}
