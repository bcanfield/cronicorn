import { buttonVariants } from "@cronicorn/ui/components/button";

import { BevelContainer } from "@/components/ui/bevel-container";
import { WindowsCard } from "@/components/windows-card";
import { appDetails } from "@/lib/app-details";
import {
	ArrowsClockwiseIcon,
	BracketsAngleIcon,
	BrainIcon,
	ChatTextIcon,
	ClockCounterClockwiseIcon,
	CodeSimpleIcon,
	GithubLogoIcon,
	PaperPlaneTiltIcon,
	PlugIcon,
	PulseIcon,
	SoccerBallIcon,
	StackIcon,
	StudentIcon,
	TagIcon,
	TerminalWindowIcon,
} from "@phosphor-icons/react/ssr";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FeatureList } from "@/features/homepage/feature-list";
import { cn } from "@cronicorn/ui/lib/utils";

export default function Home() {
	return (
		<div className="min-h-vh flex  flex-col light md:px-2 px-4">
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is safe to use here
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>

			<div className=" flex justify-center py-24 sm:py-32">
				<WindowsCard
					className="max-w-lg text-center"
					title="Cronicorn.com"
					footer={
						<div className="w-full flex items-center justify-center gap-6  py-2">
							<Link
								href={appDetails.repoUrl}
								target="_blank"
								rel="noopener noreferrer"
								className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex items-center gap-2 text-sm")}
							>
								<GithubLogoIcon className="size-5" />
								Open Sourced on Github
							</Link>
						</div>
					}
				>
					<div className="space-y-4">
						<BevelContainer innerClassName="p-2 bg-popover" variant="in">
							<div className="space-y-4 py-16">
								<p className="text-popover-foreground text-sm">[ LAUNCH YOUR FREE PLAN TODAY ]</p>
								<h1 className=" tracking-wide text-lg font-family-app-header text-center ">{appDetails.appHeader}</h1>
								<h2 className="text-sm font-family-body">{appDetails.appDescription}</h2>
								<div className="flex justify-center items-center">
									<Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
										Start Scheduling Free
									</Link>
								</div>
							</div>
						</BevelContainer>

						<div className="flex text-base font-medium items-center gap-2 justify-center text-primary font-family-heading">
							WHY DEVELOPERS{" "}
							<Image
								className="animate-[pulse_2s_ease-in-out_infinite]"
								alt="Heart Icon"
								width={12}
								height={12}
								unoptimized
								src="/assets/heart.svg"
							></Image>
							CRONICORN
						</div>
						<FeatureList
							header="How it works"
							items={[
								{
									title: "Describe the rules",
									subTitle: "Write a natural-language description of your schedule logic.",
									icon: <ChatTextIcon className="size-5" />,
									content: '"Check price volatility every 15 minutes, but slow down if it\'s stable."',
								},
								{
									title: "Connect your endpoints",
									subTitle:
										"Define the API routes your job will call (i.e. GETs for data or POSTs to trigger something).",
									icon: <PlugIcon className="size-5" />,
									content: (
										<p>
											Example: Fetch from <strong>/api/price-feed</strong>, post alerts to{" "}
											<strong>/api/notify-admins</strong>.
										</p>
									),
								},
								{
									title: "Let the AI coordinate",
									subTitle: "The scheduler handles timing based on your rules, recent responses, and posted updates.",
									icon: <BrainIcon className="size-5" />,
									content:
										"Example: After a critical spike, it checks prices every minute — then slows back down when things normalize.",
								},
								{
									title: "Post Updates Anytime",
									subTitle:
										"Send context from your own service back to the job to influence the schedule or add important messages.",
									icon: <PaperPlaneTiltIcon className="size-5" />,
									content:
										"Example: After a data import finishes, post back: “345 records processed” to influence future runs.",
								},
								{
									title: "Stay hands-off",
									subTitle:
										"You stay in control of logic, but the scheduler takes care of when to run next — no micromanaging.",
									icon: <ClockCounterClockwiseIcon className="size-5" />,
									content: "Example: No need to hardcode delays or retries — the scheduler reasons through them.",
								},
							]}
						/>

						<div className="flex text-base font-medium items-center gap-2 justify-center text-primary font-family-heading">
							REAL WORLD WORKFLOWS MADE SMARTER
						</div>

						<FeatureList
							header="USE CASES"
							items={[
								{
									title: "Threshold Alerts",
									subTitle: "Watch metrics like CPU, traffic, or sentiment.",
									icon: <PulseIcon className="size-5" />,
									content: "Poll every 10 min → Increase frequency if spike → Notify only if persistent.",
								},
								{
									title: "Course Reminder AI",
									subTitle: "Check LMS for active students.",
									icon: <StudentIcon className="size-5" />,
									content: "Send reminders only if they haven’t completed X module after 3 days.",
								},
								{
									title: "Game Syncing Bot",
									subTitle: "Poll sports API for kickoff time.",
									icon: <SoccerBallIcon className="size-5" />,
									content: "Start pregame sync 10 min before real-time start, even if kickoff moves.",
								},
								{
									title: "Price Watcher",
									subTitle: "Poll product APIs more frequently during sales events.",
									icon: <TagIcon className="size-5" />,
									content: "Post back results once change is detected.",
								},
								{
									title: "AI Agent Orchestration",
									subTitle:
										"Schedule retries, handoffs, or long-tail agents based on real-time context or completion callbacks.",
									icon: <BracketsAngleIcon className="size-5" />,
									content:
										"Example: After a data import finishes, post back: “345 records processed” to influence future runs.",
								},
							]}
						/>
						<div className="flex text-base font-medium items-center gap-2 justify-center text-primary font-family-heading">
							BUILT FOR HOW YOU ACTUALLY BUILD TODAY
						</div>

						<FeatureList
							header="What Makes It Different"
							items={[
								{
									title: "Context-aware",
									subTitle: "Understands timing in relation to prior events, states, and messages.",
									icon: <StackIcon className="size-5" />,
									content:
										"Example: After a data import finishes, post back: “345 records processed” to influence future runs.",
								},
								{
									title: "No lock-in or complex DSL",
									subTitle: "Just natural language, standard REST, and a simple job config.",
									icon: <CodeSimpleIcon className="size-5" />,
									content: "Example: Describe your rules in plain English.",
								},
								{
									title: "Dynamic scheduling",
									subTitle: "Change polling frequency or actions based on real-world conditions.",
									icon: <ArrowsClockwiseIcon className="size-5" />,
									content: "Example: Poll every 10 min → Increase frequency if spike → Notify only if persistent.",
								},
								{
									title: "Developer-friendly",
									subTitle: "One endpoint to post updates. One place to configure jobs. Zero orchestration needed.",
									icon: <TerminalWindowIcon className="size-5" />,
									content: "Example: No need to hardcode delays or retries — the scheduler reasons through them.",
								},
							]}
						/>
					</div>
				</WindowsCard>
			</div>
		</div>
	);
}

export const metadata: Metadata = {
	title: `${appDetails.appName} - ${appDetails.appHeader}`,
	description: appDetails.appDescription,
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
	metadataBase: new URL(appDetails.appUrl),
	alternates: {
		canonical: "/",
	},
	openGraph: {
		title: `${appDetails.appName} - ${appDetails.appHeader}`,
		description: appDetails.appDescription,
		url: appDetails.appUrl,
		siteName: appDetails.appName,
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
	url: appDetails.appUrl,
	applicationCategory: "DeveloperApplication",

	codeRepository: "https://github.com/bcanfield/cronicorn",
	license: "https://opensource.org/licenses/MIT",
	programmingLanguage: ["TypeScript"],
	operatingSystem: "Web Browser",
};
