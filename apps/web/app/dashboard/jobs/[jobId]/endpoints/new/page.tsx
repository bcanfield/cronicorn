import { getSession } from "@/lib/auth-wrapper";

import { redirect, notFound } from "next/navigation";
import { prisma } from "@cronicorn/database";
import { CreateEndpointClient } from "./create-endpoint-client";

interface CreateEndpointPageProps {
	jobId: string;
}

export default async function CreateEndpointPage({ params }: { params: Promise<CreateEndpointPageProps> }) {
	const { jobId } = await params;
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
			<h1 className="text-3xl font-bold">Add Endpoint</h1>
			<CreateEndpointClient jobId={jobId} />
		</div>
	);
}
