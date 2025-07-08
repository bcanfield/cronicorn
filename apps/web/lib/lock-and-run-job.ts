import { runAgentForJob, type UIMessage } from "@cronicorn/agent";
import { prisma } from "@cronicorn/database";

export const lockAndRunJob = async ({ jobId, messages }: { jobId: string; messages: UIMessage[] }) => {
	// 2) Try to lock
	const gotLock = await prisma.job
		.updateMany({
			where: { id: jobId, locked: false },
			data: { locked: true },
		})
		.then((r) => r.count === 1);

	if (!gotLock) return;

	// 3) Run agent, then unlock in finally
	return runAgentForJob({ jobId, messages }).finally(async () => {
		await prisma.job.update({
			where: { id: jobId },
			data: { locked: false },
		});
	});
};
