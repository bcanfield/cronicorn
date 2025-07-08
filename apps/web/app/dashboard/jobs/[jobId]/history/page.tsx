import { getSession } from "@/lib/auth-wrapper";

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@cronicorn/database";
import { Button } from "@/components/ui/button";
import { HistoryTable } from "@/components/tables/history-table";
import { ArrowLeft } from "lucide-react";

interface HistoryPageProps {
	jobId: string;
}

export default async function HistoryPage({ params }: { params: Promise<HistoryPageProps> }) {
	const session = await getSession();
	const { jobId } = await params;

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

	const messages = await prisma.message.findMany({
		where: {
			jobId: jobId,
		},
		orderBy: {
			createdAt: "desc",
			// timestamp: "desc",
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
				<h1 className="text-3xl font-bold">Job History</h1>
			</div>

			<HistoryTable messages={messages} />
		</div>
	);
}
