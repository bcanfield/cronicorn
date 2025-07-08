import { getSession } from "@/lib/auth-wrapper";

import { CreateApiKeyForm } from "./create-api-key-form";
import { ApiKeyList } from "./api-key-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@cronicorn/database";

async function getApiKeys(userId: string) {
	return await prisma.apiKey.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
	});
}

export async function ApiKeyManager() {
	const session = await getSession();

	if (!session?.user?.email) {
		return <div>Please sign in to manage API keys</div>;
	}

	const user = await prisma.user.findUnique({
		where: { email: session.user.email },
	});

	if (!user) {
		return <div>User not found</div>;
	}

	const apiKeys = await getApiKeys(user.id);

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Create New API Key</CardTitle>
					<CardDescription>Generate a new API key for your applications</CardDescription>
				</CardHeader>
				<CardContent>
					<CreateApiKeyForm userId={user.id} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Your API Keys</CardTitle>
					<CardDescription>Manage your existing API keys</CardDescription>
				</CardHeader>
				<CardContent>
					{apiKeys.length === 0 ? (
						<p className="text-muted-foreground text-center py-4">No API keys found. Create your first one above.</p>
					) : (
						<ApiKeyList apiKeys={apiKeys} />
					)}
				</CardContent>
			</Card>
		</div>
	);
}
