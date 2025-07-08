"use client";

import Link from "next/link";
import type { Endpoint } from "@cronicorn/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface EndpointsTableProps {
	endpoints: Endpoint[];
	jobId: string;
}

export function EndpointsTable({ endpoints, jobId }: EndpointsTableProps) {
	const router = useRouter();

	const handleDelete = async (endpointId: string) => {
		try {
			const response = await fetch(`/api/jobs/${jobId}/endpoints/${endpointId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				router.refresh();
			}
		} catch (error) {
			console.error("Failed to delete endpoint:", error);
		}
	};

	const getMethodBadge = (method: string) => {
		const colors = {
			GET: "default",
			POST: "secondary",
			PUT: "outline",
			PATCH: "outline",
			DELETE: "destructive",
		} as const;

		return <Badge variant={colors[method as keyof typeof colors] || "default"}>{method}</Badge>;
	};

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>URL</TableHead>
					<TableHead>Method</TableHead>

					<TableHead>Fire and Forget</TableHead>
					<TableHead className="w-24">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{endpoints.map((endpoint) => (
					<TableRow key={endpoint.id}>
						<TableCell className="font-medium">{endpoint.name}</TableCell>
						<TableCell className="max-w-xs truncate">{endpoint.url}</TableCell>
						<TableCell>{getMethodBadge(endpoint.method)}</TableCell>
						<TableCell>{endpoint.fireAndForget ? "Yes" : "No"}</TableCell>
						<TableCell>
							<div className="flex items-center space-x-2">
								<Button size="sm" variant="outline" asChild>
									<Link href={`/dashboard/jobs/${jobId}/endpoints/${endpoint.id}/edit`}>
										<Edit className="h-3 w-3" />
									</Link>
								</Button>
								<Button size="sm" variant="outline" onClick={() => handleDelete(endpoint.id)}>
									<Trash2 className="h-3 w-3" />
								</Button>
							</div>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
