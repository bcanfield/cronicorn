import { runAgentForJob, type UIMessage } from "@cronicorn/agent";
import { lockJob, unlockJob } from "@cronicorn/database/jobs";

export const lockAndRunJob = async ({ jobId, messages }: { jobId: string; messages: UIMessage[] }) => {
	const [locked] = await lockJob(jobId);
	if (!locked) return;

	return runAgentForJob({ jobId, messages }).finally(async () => {
		await unlockJob(jobId);
	});
};
