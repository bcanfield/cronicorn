import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
			<h1 className="text-4xl font-bold">404</h1>
			<h2 className="text-xl font-semibold">Page Not Found</h2>
			<p className="text-muted-foreground text-center max-w-md">
				The page you're looking for doesn't exist or you don't have permission to access it.
			</p>
			<Button asChild>
				<Link href="/dashboard/jobs">
					<Home className="h-4 w-4 mr-2" />
					Go to Jobs
				</Link>
			</Button>
		</div>
	);
}
