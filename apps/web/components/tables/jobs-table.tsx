"use client";

import { useState } from "react";
import Link from "next/link";
import type { Job, JobStatus } from "@cronicorn/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateTimeDisplay } from "@cronicorn/ui/components/date-time-display";
import { MoreHorizontal, Play } from "lucide-react";

interface JobsTableProps {
	jobs: Job[];
	onRunNow: (jobId: string) => Promise<void>;
	onBulkAction: (action: string, jobIds: string[]) => Promise<void>;
}

export function JobsTable({ jobs, onRunNow, onBulkAction }: JobsTableProps) {
	const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

	const handleSelectAll = (checked: boolean) => {
		setSelectedJobs(checked ? jobs.map((job) => job.id) : []);
	};

	const handleSelectJob = (jobId: string, checked: boolean) => {
		setSelectedJobs((prev) => (checked ? [...prev, jobId] : prev.filter((id) => id !== jobId)));
	};

	const getStatusBadge = (status: JobStatus) => {
		const variants = {
			ACTIVE: "default",
			PAUSED: "secondary",
			ARCHIVED: "outline",
		} as const;

		return <Badge variant={variants[status]}>{status.toLowerCase()}</Badge>;
	};

	return (
		<div className="space-y-4">
			{selectedJobs.length > 0 && (
				<div className="flex items-center space-x-2">
					<span className="text-sm text-muted-foreground">{selectedJobs.length} selected</span>
					<Button size="sm" variant="outline" onClick={() => onBulkAction("pause", selectedJobs)}>
						Pause
					</Button>
					<Button size="sm" variant="outline" onClick={() => onBulkAction("activate", selectedJobs)}>
						Activate
					</Button>
					<Button size="sm" variant="outline" onClick={() => onBulkAction("archive", selectedJobs)}>
						Archive
					</Button>
					<Button size="sm" variant="destructive" onClick={() => onBulkAction("delete", selectedJobs)}>
						Delete
					</Button>
				</div>
			)}

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-12">
							<Checkbox checked={selectedJobs.length === jobs.length} onCheckedChange={handleSelectAll} />
						</TableHead>
						<TableHead>ID</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Next Run</TableHead>
						<TableHead>Updated At</TableHead>
						<TableHead className="w-24">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{jobs.map((job) => (
						<TableRow key={job.id}>
							<TableCell>
								<Checkbox
									checked={selectedJobs.includes(job.id)}
									onCheckedChange={(checked) => handleSelectJob(job.id, !!checked)}
								/>
							</TableCell>
							<TableCell>
								<Link href={`/dashboard//jobs/${job.id}`} className="hover:underline">
									{job.id.slice(0, 8)}...
								</Link>
							</TableCell>
							<TableCell>{getStatusBadge(job.status)}</TableCell>
							<TableCell>{job.nextRunAt ? <DateTimeDisplay date={job.nextRunAt} /> : "Not scheduled"}</TableCell>
							<TableCell>
								<DateTimeDisplay date={job.updatedAt} />
							</TableCell>
							<TableCell>
								<div className="flex items-center space-x-2">
									<Button size="sm" variant="outline" onClick={() => onRunNow(job.id)}>
										<Play className="h-3 w-3" />
									</Button>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="sm">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem asChild>
												<Link href={`/dashboard//jobs/${job.id}`}>View Details</Link>
											</DropdownMenuItem>
											<DropdownMenuItem asChild>
												<Link href={`/dashboard//jobs/${job.id}/edit`}>Edit</Link>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
