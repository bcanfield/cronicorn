"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { JobStatus } from "@cronicorn/database";
import { Play, Pause, Archive } from "lucide-react";

interface JobDetailClientProps {
	jobId: string;
	status: JobStatus;
}

export function JobDetailClient({ jobId, status }: JobDetailClientProps) {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleRunNow = async () => {
		setIsLoading(true);
		try {
			const response = await fetch(`/api/jobs/${jobId}/run`, {
				method: "POST",
			});

			if (response.ok) {
				router.refresh();
			}
		} catch (error) {
			console.error("Failed to run job:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleStatusChange = async (newStatus: JobStatus) => {
		setIsLoading(true);
		try {
			const response = await fetch(`/api/jobs/${jobId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ status: newStatus }),
			});

			if (response.ok) {
				router.refresh();
			}
		} catch (error) {
			console.error("Failed to update job status:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Button onClick={handleRunNow} disabled={isLoading}>
				<Play className="h-4 w-4 mr-2" />
				Run Now
			</Button>

			{status === JobStatus.ACTIVE ? (
				<Button variant="outline" onClick={() => handleStatusChange(JobStatus.PAUSED)} disabled={isLoading}>
					<Pause className="h-4 w-4 mr-2" />
					Pause
				</Button>
			) : (
				<Button variant="outline" onClick={() => handleStatusChange(JobStatus.ACTIVE)} disabled={isLoading}>
					<Play className="h-4 w-4 mr-2" />
					Activate
				</Button>
			)}

			<Button variant="outline" onClick={() => handleStatusChange(JobStatus.ARCHIVED)} disabled={isLoading}>
				<Archive className="h-4 w-4 mr-2" />
				Archive
			</Button>
		</>
	);
}
