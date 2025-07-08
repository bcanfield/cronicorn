import { getSession } from "@/lib/auth-wrapper";

import { redirect, notFound } from "next/navigation";
import { prisma } from "@cronicorn/database";
import { EditJobClient } from "./edit-job-client";

interface EditJobPageProps {
	jobId: string;
}

export default async function EditJobPage({ params }: { params: Promise<EditJobPageProps> }) {
	const { jobId } = await params;
	// Get the session to verify user identity
	const session = await getSession();

	if (!session?.user?.id) {
		redirect("/api/auth/signin");
	}

	const job = await prisma.job.findFirst({
		where: {
			id: jobId,
			userId: session.user.id,
		},
	});

	if (!job) {
		notFound();
	}

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold">Edit Job</h1>
			<EditJobClient job={job} />
		</div>
	);
}
