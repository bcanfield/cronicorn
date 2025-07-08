import { getSession } from "@/lib/auth-wrapper";

import { redirect, notFound } from "next/navigation";
import { prisma } from "@cronicorn/database";
import { EditEndpointClient } from "./edit-endpoint-client";

interface EditEndpointPageProps {
	jobId: string;
	endpointId: string;
}

export default async function EditEndpointPage({ params }: { params: Promise<EditEndpointPageProps> }) {
	const { jobId, endpointId } = await params;
	const session = await getSession();

	if (!session?.user?.id) {
		redirect("/api/auth/signin");
	}

	const endpoint = await prisma.endpoint.findFirst({
		where: {
			id: endpointId,
			job: {
				id: jobId,
				userId: session.user.id,
			},
		},
	});

	if (!endpoint) {
		notFound();
	}

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold">Edit Endpoint</h1>
			<EditEndpointClient endpoint={endpoint} jobId={jobId} />
		</div>
	);
}
