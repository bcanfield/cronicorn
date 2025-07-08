import { getSession } from "@/lib/auth-wrapper";

import { redirect } from "next/navigation";
import { prisma } from "@cronicorn/database";
import { ApiKeysPageClient } from "./api-keys-page-client";

export default async function ApiKeysPage() {
	const session = await getSession();

	if (!session?.user?.id) {
		redirect("/api/auth/signin");
	}

	const apiKeys = await prisma.apiKey.findMany({
		where: {
			userId: session.user.id,
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold">API Keys</h1>
			<ApiKeysPageClient apiKeys={apiKeys} />
		</div>
	);
}
