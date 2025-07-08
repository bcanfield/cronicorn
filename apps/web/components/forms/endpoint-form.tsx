"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JSONEditor } from "@/components/ui/json-editor";
import { Checkbox } from "@/components/ui/checkbox";

const endpointSchema = z.object({
	name: z.string().min(1, "Name is required"),
	url: z.string().url("Must be a valid URL"),
	method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
	fireAndForget: z.boolean().optional(),
	bearerToken: z.string().optional(),
	requestSchema: z.string().optional(),
});

type EndpointFormData = z.infer<typeof endpointSchema>;

interface EndpointFormProps {
	initialData?: Partial<EndpointFormData & { requestSchema: any }>;
	onSubmit: (data: EndpointFormData & { requestSchema: any }) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export function EndpointForm({ initialData, onSubmit, onCancel, isLoading }: EndpointFormProps) {
	const form = useForm<EndpointFormData>({
		resolver: zodResolver(endpointSchema),
		defaultValues: {
			name: initialData?.name || "",
			url: initialData?.url || "",
			method: initialData?.method || "POST",
			bearerToken: initialData?.bearerToken || "",
			fireAndForget: initialData?.fireAndForget,
			requestSchema: initialData?.requestSchema ? JSON.stringify(initialData.requestSchema, null, 2) : "",
		},
	});

	const handleSubmit = async (data: EndpointFormData) => {
		let parsedSchema = null;
		if (data.requestSchema) {
			try {
				parsedSchema = JSON.parse(data.requestSchema);
			} catch (error) {
				form.setError("requestSchema", { message: "Invalid JSON format" });
				return;
			}
		}

		await onSubmit({
			...data,
			requestSchema: parsedSchema,
		});
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input placeholder="Endpoint name" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="url"
					render={({ field }) => (
						<FormItem>
							<FormLabel>URL</FormLabel>
							<FormControl>
								<Input autoComplete="off" placeholder="https://api.example.com/webhook" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="method"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Method</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select method" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="GET">GET</SelectItem>
									<SelectItem value="POST">POST</SelectItem>
									<SelectItem value="PUT">PUT</SelectItem>
									<SelectItem value="PATCH">PATCH</SelectItem>
									<SelectItem value="DELETE">DELETE</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="fireAndForget"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Fire and Forget</FormLabel>
							<Checkbox onCheckedChange={field.onChange} checked={field.value} />
							<FormDescription>Send and move on (no response needed) </FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="bearerToken"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Bearer Token (Optional)</FormLabel>
							<FormControl>
								<Input placeholder="Bearer token" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="requestSchema"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Request Schema (Optional)</FormLabel>
							<FormControl>
								<JSONEditor {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end space-x-2">
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? "Saving..." : "Save"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
