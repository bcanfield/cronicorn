"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Clock } from "lucide-react";
import Link from "next/link";
import { useJobs } from "@/lib/hooks/use-jobs";
import type { JobStatus } from "@cronicorn/rest-api";

function getStatusColor(status: JobStatus) {
	switch (status) {
		case "ACTIVE":
			return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
		case "PAUSED":
			return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
		case "ARCHIVED":
			return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
		default:
			return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
	}
}

function formatNextRun(nextRunAt: string | null) {
	if (!nextRunAt) return "Not scheduled";

	const now = new Date();
	const runTime = new Date(nextRunAt);
	const diff = runTime.getTime() - now.getTime();

	if (diff < 0) return "Overdue";

	const minutes = Math.floor(diff / (1000 * 60));
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `in ${days}d ${hours % 24}h`;
	if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
	return `in ${minutes}m`;
}

export function JobsTablePanel() {
	const { data, isLoading, error } = useJobs({ limit: 5, sortBy: "updatedAt" });

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="flex items-center space-x-4">
								<Skeleton className="h-4 w-48" />
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-4 w-32" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5" />
						Recent Jobs
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-destructive">Failed to load jobs</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5" />
						Recent Jobs
					</CardTitle>
				</div>
				<Button variant="outline" size="sm" asChild>
					<Link href="/jobs">
						View All
						<ExternalLink className="h-4 w-4 ml-2" />
					</Link>
				</Button>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Job Description</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Next Run</TableHead>
							<TableHead>Context</TableHead>
							<TableHead>Tokens</TableHead>
							<TableHead></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data?.jobs.map((job) => (
							<TableRow key={job.id} className="cursor-pointer hover:bg-muted/50">
								<TableCell className="font-medium max-w-xs">
									<div className="truncate" title={job.definitionNL}>
										{job.definitionNL}
									</div>
								</TableCell>
								<TableCell>
									<Badge className={getStatusColor(job.status)}>{job.status}</Badge>
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">{formatNextRun(job.nextRunAt)}</TableCell>
								<TableCell className="text-sm">{job.contextEntries} entries</TableCell>
								<TableCell className="text-sm">{job.totalTokens.toLocaleString()}</TableCell>
								<TableCell>
									<Button variant="ghost" size="sm" asChild>
										<Link href={`/jobs/${job.id}`}>
											<ExternalLink className="h-4 w-4" />
										</Link>
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
