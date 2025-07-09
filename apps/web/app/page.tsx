import { buttonVariants } from "@cronicorn/ui/components/button";

import { WindowsCard } from "@/components/windows-card";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export default function Home() {
	return (
		<div className="min-h-screen flex items-center justify-center light">
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is safe to use here
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>
			<WindowsCard
				className="max-w-lg text-center"
				title="Cronicorn.com"
				footer={
					<div className="w-full flex items-center justify-between gap-6 text-center">
						<p className=" tracking-wide text-sm">
							Describe your rules, attach your endpoints, and let it run — nudge it when you need to.
						</p>
						{/* <Link href="/api/auth/signin" className={buttonVariants({ variant: "outline" })}>
							Sign in With Github
						</Link> */}
					</div>
				}
			>
				<div className="flex items-center gap-2 justify-center">
					<Image width={60} height={60} src="/cronicorn.png" alt="icon" />
					<h1 className="text-2xl tracking-tighter font-family-app-header!">Cronicorn</h1>
				</div>
				<p className=" tracking-wide text-xl ">Dynamic cron for modern apps.</p>

				<div className="flex justify-center items-center">
					<Link href="/dashboard" className={buttonVariants({ variant: "outline", className: "w-1/2" })}>
						Start Free
					</Link>
				</div>
			</WindowsCard>
		</div>
	);
}

export const metadata: Metadata = {
	title: "Cronicorn - Dynamic cron for modern apps",
	description: "Describe your rules, attach your endpoints, and let it run — nudge it when you need to.",
	keywords: [
		"AI cron scheduler",
		"open source",
		"task automation",
		"intelligent scheduling",
		"Next.js",
		"artificial intelligence",
		"cron jobs",
		"task management",
		"automation tool",
	],
	metadataBase: new URL("https://cronicorn.com"),
	alternates: {
		canonical: "/",
	},
	openGraph: {
		title: "Cronicorn - Dynamic cron for modern apps",
		description: "ODescribe your rules, attach your endpoints, and let it run — nudge it when you need to.",
		url: "https://cronicorn.com",
		siteName: "Cronicorn",
		// images: [
		// 	{
		// 		url: "/og-image.jpg", // You'll need to create this image
		// 		width: 1200,
		// 		height: 630,
		// 		alt: "AI Cron Scheduler - Open Source Task Automation",
		// 	},
		// ],
		locale: "en_US",
		type: "website",
	},
	// twitter: {
	// 	card: "summary_large_image",
	// 	title: "AI Cron Scheduler - Open Source Intelligent Task Automation",
	// 	description: "Open source AI-powered cron scheduler that intelligently manages and automates your tasks.",
	// 	images: ["/twitter-image.jpg"], // You'll need to create this image
	// 	creator: "@yourtwitterhandle", // Replace with your Twitter handle
	// },
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	// verification: {
	// 	google: "your-google-verification-code", // Replace with your Google Search Console verification code
	// },
};
const jsonLd = {
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: "Cronicorn - Dynamic cron for modern apps",
	description: "Describe your rules, attach your endpoints, and let it run — nudge it when you need to.",
	url: "https://cronicorn.com",
	applicationCategory: "DeveloperApplication",

	codeRepository: "https://github.com/bcanfield/cronicorn",
	license: "https://opensource.org/licenses/MIT",
	programmingLanguage: ["TypeScript"],
	operatingSystem: "Web Browser",
};
