"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DateTimeDisplay } from "@cronicorn/ui/components/date-time-display";
import { Trash2 } from "lucide-react";
import { maskApiKey } from "@/lib/utils";
import type { ApiKey } from "@cronicorn/database";

interface ApiKeysTableProps {
	apiKeys: ApiKey[];
	onRevoke: (keyId: string) => Promise<void>;
}

export function ApiKeysTable({ apiKeys, onRevoke }: ApiKeysTableProps) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Description</TableHead>
					<TableHead>Key</TableHead>
					<TableHead>Created At</TableHead>
					<TableHead>Last Used</TableHead>
					<TableHead className="w-24">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{apiKeys.map((apiKey) => (
					<TableRow key={apiKey.id}>
						<TableCell className="font-medium">{apiKey.name}</TableCell>
						<TableCell className="font-mono text-sm">{maskApiKey(apiKey.key)}</TableCell>
						<TableCell>
							<DateTimeDisplay date={apiKey.createdAt} />
						</TableCell>
						<TableCell>{apiKey.lastUsed ? <DateTimeDisplay date={apiKey.lastUsed} /> : "Never"}</TableCell>
						<TableCell>
							<Button size="sm" variant="outline" onClick={() => onRevoke(apiKey.id)}>
								<Trash2 className="h-3 w-3" />
							</Button>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
