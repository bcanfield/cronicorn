"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JobStatus } from "@cronicorn/database";

const jobSchema = z.object({
	definitionNL: z.string().min(1, "Definition is required"),
	status: z.nativeEnum(JobStatus),
});

type JobFormData = z.infer<typeof jobSchema>;

interface JobFormProps {
	initialData?: Partial<JobFormData>;
	onSubmit: (data: JobFormData) => Promise<void>;
	onCancel: () => void;
	isLoading?: boolean;
}

export function JobForm({ initialData, onSubmit, onCancel, isLoading }: JobFormProps) {
	const form = useForm<JobFormData>({
		resolver: zodResolver(jobSchema),
		defaultValues: {
			definitionNL: initialData?.definitionNL || "",
			status: initialData?.status || JobStatus.PAUSED,
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="definitionNL"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Job Definition</FormLabel>
							<FormControl>
								<Textarea placeholder="Describe what this job should do..." className="min-h-[100px]" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="status"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Status</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select status" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value={JobStatus.ACTIVE}>Active</SelectItem>
									<SelectItem value={JobStatus.PAUSED}>Paused</SelectItem>
									<SelectItem value={JobStatus.ARCHIVED}>Archived</SelectItem>
								</SelectContent>
							</Select>
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
