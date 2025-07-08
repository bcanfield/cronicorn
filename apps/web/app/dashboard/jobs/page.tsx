import { getSession } from "@/lib/auth-wrapper";

import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@cronicorn/database";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { JobsPageClient } from "./jobs-page-client";

export default async function JobsPage() {
	const session = await getSession();
	console.log("Session:", session);

	if (!session?.user?.id) {
		redirect("/api/auth/signin");
	}

	const jobs = await prisma.job.findMany({
		where: {
			userId: session.user.id,
		},
		orderBy: {
			updatedAt: "desc",
		},
	});

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Jobs</h1>
				<Button asChild>
					<Link href="/dashboard/jobs/new">
						<Plus className="h-4 w-4 mr-2" />
						Create Job
					</Link>
				</Button>
			</div>

			<JobsPageClient jobs={jobs} />
		</div>
	);
}
