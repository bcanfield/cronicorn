"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiKey } from "@/lib/api-key-management/actions";

interface CreateApiKeyFormProps {
	userId: string;
}

export function CreateApiKeyForm({ userId }: CreateApiKeyFormProps) {
	const [pending, setPending] = useState(false);

	async function handleSubmit(formData: FormData) {
		setPending(true);
		try {
			await createApiKey(formData);
			// Reset form
			const form = document.getElementById("create-key-form") as HTMLFormElement;
			form?.reset();
		} catch (error) {
			console.error("Failed to create API key:", error);
		} finally {
			setPending(false);
		}
	}

	return (
		<form action={handleSubmit} className="space-y-4">
			<input type="hidden" name="userId" value={userId} />
			<div>
				<Label htmlFor="keyName">Key Name</Label>
				<Input name="name" placeholder="Enter a name for your API key" required />
			</div>
			<Button type="submit" disabled={pending} className="w-full">
				{pending ? "Creating..." : "Generate New Key"}
			</Button>
		</form>
	);
}
