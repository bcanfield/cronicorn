"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { JobForm } from "@/components/forms/job-form";
import type { JobStatus } from "@cronicorn/database";

export function CreateJobClient() {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (data: { definitionNL: string; status: JobStatus }) => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/jobs", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (response.ok) {
				const job = await response.json();
				router.push(`/dashboard/jobs/${job.id}`);
			}
		} catch (error) {
			console.error("Failed to create job:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		router.push("/dashboard/jobs");
	};

	return <JobForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />;
}
