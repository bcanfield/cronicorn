import type { Message } from "@cronicorn/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DateTimeDisplay } from "@cronicorn/ui/components/date-time-display";
import type { ModelMessage } from "@cronicorn/agent";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Markdown from "react-markdown";

interface HistoryTableProps {
	messages: Message[];
}

export function HistoryTable({ messages }: HistoryTableProps) {
	const getRoleBadge = (role: string) => {
		const colors = {
			user: "default",
			assistant: "secondary",
			system: "outline",
		} as const;

		return <Badge variant={colors[role as keyof typeof colors] || "default"}>{role}</Badge>;
	};

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>#</TableHead>
					<TableHead>ID</TableHead>

					<TableHead>Timestamp</TableHead>
					<TableHead>Role</TableHead>
					<TableHead>Type</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{messages.map((message, index) => {
					const messageContent = message.content as ModelMessage["content"] | string;

					return (
						<TableRow key={message.id}>
							<TableCell>{messages.length - index}</TableCell>
							<TableCell>{message.id}</TableCell>

							<TableCell>
								<DateTimeDisplay date={message.createdAt} />
							</TableCell>
							<TableCell>{getRoleBadge(message.role)}</TableCell>

							<TableCell className="max-w-md">
								{typeof messageContent === "string" ? (
									<Dialog>
										<DialogTrigger asChild>
											<Button variant={"outline"} className="flex items-center gap-1 w-fit">
												<div className="flex items-center gap-1 truncate">
													<Badge>Text</Badge>
												</div>
											</Button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>Text</DialogTitle>
												<DialogDescription></DialogDescription>
											</DialogHeader>
											<Markdown>{messageContent}</Markdown>
										</DialogContent>
									</Dialog>
								) : (
									<div className="flex flex-col gap-1">
										{Object.entries(messageContent).map(([key, value]) => {
											if (typeof value === "undefined") return null; // Skip undefined values
											if (typeof value === "string") return value;
											if (value.text) {
												return (
													<Dialog key={key}>
														<DialogTrigger asChild>
															<Button variant={"outline"} className="flex items-center gap-1 w-fit">
																<div className="flex items-center gap-1 truncate">
																	<Badge>Text</Badge>
																</div>
															</Button>
														</DialogTrigger>
														<DialogContent>
															<DialogHeader>
																<DialogTitle>Text</DialogTitle>
																<DialogDescription></DialogDescription>
															</DialogHeader>
															<Markdown>{value.text}</Markdown>
														</DialogContent>
													</Dialog>
												);
											}
											if (value.type === "tool-call") {
												return (
													<Dialog key={key}>
														<DialogTrigger asChild>
															<Button variant={"outline"} className="flex items-center gap-1 w-fit">
																<Badge>Tool Call</Badge>
																{value.toolName}
															</Button>
														</DialogTrigger>
														<DialogContent>
															<DialogHeader>
																<DialogTitle>{value.toolName}</DialogTitle>
																<DialogDescription></DialogDescription>
															</DialogHeader>
															<pre className="text-sm text-wrap "> {JSON.stringify(value.input, null, 2)}</pre>
														</DialogContent>
													</Dialog>
												);
											}
											if (value.type === "tool-result") {
												return (
													<Dialog key={key}>
														<DialogTrigger asChild>
															<Button variant={"outline"} className="flex items-center gap-1 w-fit">
																<Badge className="bg-accent">Tool Result</Badge>
																{value.toolName}
															</Button>
														</DialogTrigger>
														<DialogContent>
															<DialogHeader>
																<DialogTitle>{value.toolName}</DialogTitle>
																<DialogDescription></DialogDescription>
															</DialogHeader>
															<pre className="text-sm text-wrap">{JSON.stringify(value.output, null, 2)}</pre>
														</DialogContent>
													</Dialog>
												);
											}
											return (
												<div key={key}>
													<strong>{key}:</strong> {typeof value === "string" ? value : JSON.stringify(value)}
												</div>
											);
										})}
									</div>
								)}
								{/* <div className="truncate">
								{typeof message.content === "string" ? message.content : JSON.stringify(message.content)}
							</div> */}
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}
