"use client";

import { JobsTable } from "@/components/tables/jobs-table";
import type { Job } from "@cronicorn/database";
import { useRouter } from "next/navigation";

interface JobsPageClientProps {
	jobs: Job[];
}

export function JobsPageClient({ jobs }: JobsPageClientProps) {
	const router = useRouter();

	const handleRunNow = async (jobId: string) => {
		try {
			const response = await fetch(`/api/jobs/${jobId}/run`, {
				method: "POST",
			});

			if (response.ok) {
				router.refresh();
			}
		} catch (error) {
			console.error("Failed to run job:", error);
		}
	};

	const handleBulkAction = async (action: string, jobIds: string[]) => {
		try {
			const response = await fetch("/api/jobs/bulk", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ action, jobIds }),
			});

			if (response.ok) {
				router.refresh();
			}
		} catch (error) {
			console.error("Failed to perform bulk action:", error);
		}
	};

	return <JobsTable jobs={jobs} onRunNow={handleRunNow} onBulkAction={handleBulkAction} />;
}
