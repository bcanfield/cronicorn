import { getSession } from "@/lib/auth-wrapper";

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@cronicorn/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimeDisplay } from "@cronicorn/ui/components/date-time-display";
import { EndpointsTable } from "@/components/tables/endpoints-table";
import { Edit, Plus, History, Database } from "lucide-react";
import { JobDetailClient } from "./job-detail-client";

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
	const session = await getSession();

	if (!session?.user?.id) {
		redirect("/api/auth/signin");
	}
	const { jobId } = await params;

	const job = await prisma.job.findFirst({
		where: {
			id: jobId,
			userId: session.user.id,
		},
		include: {
			endpoints: true,
		},
	});

	if (!job) {
		notFound();
	}

	const getStatusBadge = (status: string) => {
		const variants = {
			ACTIVE: "default",
			PAUSED: "secondary",
			ARCHIVED: "outline",
		} as const;

		return <Badge variant={variants[status as keyof typeof variants]}>{status.toLowerCase()}</Badge>;
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-start">
				<div>
					<h1 className="text-3xl font-bold">Job Details</h1>
					<p className="text-muted-foreground">ID: {job.id}</p>
				</div>
				<div className="flex space-x-2">
					<Button variant="outline" asChild>
						<Link href={`/dashboard/jobs/${job.id}/edit`}>
							<Edit className="h-4 w-4 mr-2" />
							Edit Job
						</Link>
					</Button>
					<JobDetailClient jobId={job.id} status={job.status} />
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Job Summary</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<h3 className="font-semibold mb-2">Definition</h3>
						<p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{job.definitionNL}</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<h4 className="font-medium">Status</h4>
							{getStatusBadge(job.status)}
						</div>
						<div>
							<h4 className="font-medium">Next Run</h4>
							<p className="text-sm">{job.nextRunAt ? <DateTimeDisplay date={job.nextRunAt} /> : "Not scheduled"}</p>
						</div>
						<div>
							<h4 className="font-medium">Created</h4>
							<p className="text-sm">
								<DateTimeDisplay date={job.createdAt} />
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<CardTitle>Endpoints</CardTitle>
						<Button asChild>
							<Link href={`/dashboard/jobs/${job.id}/endpoints/new`}>
								<Plus className="h-4 w-4 mr-2" />
								Add Endpoint
							</Link>
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{job.endpoints.length > 0 ? (
						<EndpointsTable endpoints={job.endpoints} jobId={job.id} />
					) : (
						<p className="text-muted-foreground">No endpoints configured</p>
					)}
				</CardContent>
			</Card>

			<div className="flex space-x-4">
				<Button variant="outline" asChild>
					<Link href={`/dashboard/jobs/${job.id}/history`}>
						<History className="h-4 w-4 mr-2" />
						View History
					</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href={`/dashboard/jobs/${job.id}/context`}>
						<Database className="h-4 w-4 mr-2" />
						View Context
					</Link>
				</Button>
			</div>
		</div>
	);
}
