import type { ContextEntry } from "@cronicorn/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateTimeDisplay } from "@cronicorn/ui/components/date-time-display";

interface ContextTableProps {
	contextEntries: ContextEntry[];
}

export function ContextTable({ contextEntries }: ContextTableProps) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Key</TableHead>
					<TableHead>Value</TableHead>
					<TableHead>Updated At</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{contextEntries.map((entry) => (
					<TableRow key={entry.id}>
						<TableCell className="font-medium">{entry.key}</TableCell>
						<TableCell className="max-w-md truncate">{entry.value}</TableCell>
						<TableCell>
							<DateTimeDisplay date={entry.createdAt} />
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
