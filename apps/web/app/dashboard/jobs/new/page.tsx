import { getSession } from "@/lib/auth-wrapper";

import { redirect } from "next/navigation";
import { CreateJobClient } from "./create-job-client";

export default async function CreateJobPage() {
	const session = await getSession();

	if (!session?.user?.id) {
		redirect("/api/auth/signin");
	}

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold">Create Job</h1>
			<CreateJobClient />
		</div>
	);
}
