"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Endpoint } from "@cronicorn/database";
import { EndpointForm } from "@/components/forms/endpoint-form";

interface EditEndpointClientProps {
	endpoint: Endpoint;
	jobId: string;
}

export function EditEndpointClient({ endpoint, jobId }: EditEndpointClientProps) {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (data: any) => {
		console.log("Submitting endpoint data:", data);
		setIsLoading(true);
		try {
			const response = await fetch(`/api/jobs/${jobId}/endpoints/${endpoint.id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (response.ok) {
				router.push(`/dashboard/jobs/${jobId}`);
			}
		} catch (error) {
			console.error("Failed to update endpoint:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		router.push(`/dashboard/jobs/${jobId}`);
	};

	return (
		<EndpointForm
			initialData={{
				name: endpoint.name,
				url: endpoint.url,
				method: endpoint.method as any,
				bearerToken: endpoint.bearerToken || "",
				requestSchema: endpoint.requestSchema,
				fireAndForget: endpoint.fireAndForget,
			}}
			onSubmit={handleSubmit}
			onCancel={handleCancel}
			isLoading={isLoading}
		/>
	);
}
