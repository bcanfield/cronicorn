import { Button, buttonVariants } from "@cronicorn/ui/components/button";

import { WindowsCard } from "@/components/windows-card";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
	return (
		<div className="min-h-screen flex items-center justify-center light">
			<WindowsCard
				className="max-w-sm"
				title="Cronicorn.com"
				footer={
					<div className="w-full flex items-center justify-end">
						<Link href="/api/auth/signin" className={buttonVariants({ variant: "outline" })}>
							Sign in With Github
						</Link>
					</div>
				}
			>
				<div className="flex items-center gap-2">
					<Image width={75} height={75} src="/cronicorn.png" alt="icon" />
					<h1 className="text-2xl tracking-tighter  mb-2 font-family-app-header!">Cronicorn</h1>
				</div>
				<p className=" tracking-wide text-lg">The stupid-simple AI cron tool.</p>
				<Link href="/dashboard" className={buttonVariants({ variant: "outline", className: "w-full" })}>
					Schedule a Job
				</Link>

				<Button variant={"outline"} className="w-full">
					Learn More
				</Button>
			</WindowsCard>
		</div>
	);
}
