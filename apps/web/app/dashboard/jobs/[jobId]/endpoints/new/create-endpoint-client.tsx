"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EndpointForm } from "@/components/forms/endpoint-form";

interface CreateEndpointClientProps {
	jobId: string;
}

export function CreateEndpointClient({ jobId }: CreateEndpointClientProps) {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (data: any) => {
		setIsLoading(true);
		try {
			const response = await fetch(`/api/jobs/${jobId}/endpoints`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (response.ok) {
				router.push(`/dashboard/jobs/${jobId}`);
			}
		} catch (error) {
			console.error("Failed to create endpoint:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		router.push(`/dashboard/jobs/${jobId}`);
	};

	return <EndpointForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />;
}
