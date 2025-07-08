"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Job, JobStatus } from "@cronicorn/database";
import { JobForm } from "@/components/forms/job-form";

interface EditJobClientProps {
	job: Job;
}

export function EditJobClient({ job }: EditJobClientProps) {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (data: { definitionNL: string; status: JobStatus }) => {
		setIsLoading(true);
		try {
			const response = await fetch(`/api/jobs/${job.id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (response.ok) {
				router.push(`/dashboard/jobs/${job.id}`);
			}
		} catch (error) {
			console.error("Failed to update job:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		router.push(`/dashboard/jobs/${job.id}`);
	};

	return (
		<JobForm
			initialData={{
				definitionNL: job.definitionNL,
				status: job.status,
			}}
			onSubmit={handleSubmit}
			onCancel={handleCancel}
			isLoading={isLoading}
		/>
	);
}
