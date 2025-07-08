import { getSession } from "@/lib/auth-wrapper";

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@cronicorn/database";
import { Button } from "@/components/ui/button";
import { ContextTable } from "@/components/tables/context-table";
import { ArrowLeft } from "lucide-react";

interface ContextPageProps {
	jobId: string;
}

export default async function ContextPage({ params }: { params: Promise<ContextPageProps> }) {
	const { jobId } = await params;
	const session = await getSession();

	if (!session?.user?.id) {
		redirect("/api/auth/signin");
	}

	const job = await prisma.job.findFirst({
		where: {
			id: jobId,
			userId: session.user.id,
		},
	});

	if (!job) {
		notFound();
	}

	const contextEntries = await prisma.contextEntry.findMany({
		where: {
			jobId: jobId,
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center space-x-4">
				<Button variant="outline" asChild>
					<Link href={`/dashboard/jobs/${jobId}`}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Job
					</Link>
				</Button>
				<h1 className="text-3xl font-bold">Job Context</h1>
			</div>

			<ContextTable contextEntries={contextEntries} />
		</div>
	);
}
