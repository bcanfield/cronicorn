import { getSession } from "@/lib/auth-wrapper";

import { redirect } from "next/navigation";
import { getUserTotalUsage, PLAN_LIMITS, type Plan } from "@cronicorn/billing-engine";

export default async function UsagePage() {
	const session = await getSession();

	if (!session?.user?.id) {
		redirect("/api/auth/signin");
	}

	const userUsage = await getUserTotalUsage({ userId: session.user.id });
	const userPlan: Plan = "free";
	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold">Usage</h1>
			<h2>Your usage across all jobs</h2>
			<pre>{JSON.stringify(userUsage, null, 2)}</pre>
			<h2>Your plan</h2>
			<h3>{userPlan}</h3>
			<p>Plan limits</p>
			<pre>{JSON.stringify(PLAN_LIMITS[userPlan], null, 2)}</pre>

			{/* <ApiKeysPageClient apiKeys={apiKeys} /> */}
		</div>
	);
}
