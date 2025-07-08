"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiKey } from "@cronicorn/database";
import { ApiKeyForm } from "@/components/forms/api-key-form";
import { ApiKeysTable } from "@/components/tables/api-keys-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ApiKeysPageClientProps {
	apiKeys: ApiKey[];
}

export function ApiKeysPageClient({ apiKeys }: ApiKeysPageClientProps) {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleCreateApiKey = async (data: { name: string }) => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/api-keys", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (response.ok) {
				const result = await response.json();
				router.refresh();
				return result.key;
			}
		} catch (error) {
			console.error("Failed to create API key:", error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	const handleRevokeApiKey = async (keyId: string) => {
		try {
			const response = await fetch(`/api/api-keys/${keyId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				router.refresh();
			}
		} catch (error) {
			console.error("Failed to revoke API key:", error);
		}
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Generate New API Key</CardTitle>
				</CardHeader>
				<CardContent>
					<ApiKeyForm onSubmit={handleCreateApiKey} isLoading={isLoading} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Existing API Keys</CardTitle>
				</CardHeader>
				<CardContent>
					{apiKeys.length > 0 ? (
						<ApiKeysTable apiKeys={apiKeys} onRevoke={handleRevokeApiKey} />
					) : (
						<p className="text-muted-foreground">No API keys found</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
