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
		<div className="min-h-vh flex  flex-col light px-4 space-y-8 items-center">
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is safe to use here
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>

			<div className="min-h-[70vh] flex flex-col justify-end">
				<WindowsCard
					className="max-w-lg text-center"
					title="Cronicorn.com"
					action={
						<Link
							href={appDetails.repoUrl}
							target="_blank"
							rel="noopener noreferrer"
							className={cn(buttonVariants({ variant: "outline", size: "xxs" }), "")}
						>
							<GithubLogoIcon className="size-4" />
							Github
						</Link>
					}
					footer={
						<div className="w-full flex items-center justify-center gap-6  py-2">
							<Link
								href={"/case-study"}
								className={cn(
									buttonVariants({ variant: "link", size: "xs", className: "decoration-primary" }),
									"flex text-base font-semibold items-center gap-2 justify-center text-primary font-family-heading",
								)}
							>
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
							</Link>
						</div>
					}
				>
					<BevelContainer innerClassName="p-2 bg-popover" variant="in">
						<div className="space-y-4 py-16">
							<h1 className="  text-2xl tracking-widest font-semibold font-family-app-header text-center ">
								{appDetails.appHeader}
							</h1>
							<h2 className="text-sm font-family-body">{appDetails.appDescription}</h2>
							<div className="flex justify-center items-center">
								<Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
									[ LAUNCH YOUR FREE PLAN TODAY ]
								</Link>
							</div>
						</div>
					</BevelContainer>
				</WindowsCard>
			</div>

			<div className="space-y-4 max-w-lg pb-24">
				<FeatureList
					header="How it works"
					items={[
						{
							title: "Describe the rules",
							subTitle: "Use plain English to define your schedule",
							icon: <ChatTextIcon className="size-5" />,
							content: `"Check volatility every 15m; slow down when stable."`,
							animate: false,
						},
						{
							title: "Connect endpoints",
							subTitle: "Your job’s API routes",
							icon: <PlugIcon className="size-5" />,
							content: (
								<div className="flex flex-col gap-2">
									<p>
										GET <strong>/api/price-feed</strong>
									</p>
									<p>
										POST <strong>/api/notify-admins</strong>
									</p>
								</div>
							),
							animate: false,
						},
						{
							title: "Let the scheduler manage timing",
							subTitle: "Schedules tasks by rules, feedback, and status",
							icon: <BrainIcon className="size-5" />,
							content: "Polls every minute after a spike, then eases off as things stabilize.",
							animate: false,
						},
						{
							title: "Share updates anytime",
							subTitle: "Send context to tweak schedule or add notes",
							icon: <PaperPlaneTiltIcon className="size-5" />,
							content: `e.g. After import, send "345 records processed" to guide the next run.`,
						},
						{
							title: "Hands-off control",
							subTitle: "You set logic; it handles timing",
							icon: <ClockCounterClockwiseIcon className="size-5" />,
							content: "No hardcoded delays or retries—the scheduler figures them out.",
						},
					]}
				/>

				<div className="flex text-base font-semibold items-center gap-2 justify-center text-primary font-family-heading">
					REAL WORLD WORKFLOWS MADE SMARTER
				</div>

				<FeatureList
					header="Use cases"
					items={[
						{
							title: "Threshold Alerts",
							subTitle: "Monitor CPU, traffic, or sentiment",
							icon: <PulseIcon className="size-5" />,
							content: "Poll every 10m; spike? Poll faster; notify only if persistent.",
						},
						{
							title: "Course Reminders",
							subTitle: "Monitor student progress in your course platform",
							icon: <StudentIcon className="size-5" />,
							content: "Send a reminder if module X isn't completed after 3 days.",
						},
						{
							title: "Game Sync Bot",
							subTitle: "Track kickoff times via sports API",
							icon: <SoccerBallIcon className="size-5" />,
							content: "Begin sync 10m before kickoff, even if start time shifts.",
						},
						{
							title: "Price Watcher",
							subTitle: "Detect sales events via API polling",
							icon: <TagIcon className="size-5" />,
							content: "Report changes as soon as they happen.",
						},
						{
							title: "Agent Orchestration",
							subTitle: "Auto handle retries, handoffs, and follow-ups",
							icon: <BracketsAngleIcon className="size-5" />,
							content: `e.g. After import, post "345 records processed" to shape the next run.`,
						},
					]}
				/>

				<div className="flex text-base font-semibold items-center gap-2 justify-center uppercase text-primary font-family-heading">
					Built for how you actially build today
				</div>

				<FeatureList
					header="Why it stands out"
					items={[
						{
							title: "Context-aware",
							subTitle: "Learns from past runs, errors, and state",
							icon: <StackIcon className="size-5" />,
						},
						{
							title: "No lock-in or DSL",
							subTitle: "Plain English, REST APIs, simple config",
							icon: <CodeSimpleIcon className="size-5" />,
						},
						{
							title: "Dynamic scheduling",
							subTitle: "Adapts to real-world conditions",
							icon: <ArrowsClockwiseIcon className="size-5" />,
						},
						{
							title: "Developer-friendly",
							subTitle: "One endpoint, one config, no headache",
							icon: <TerminalWindowIcon className="size-5" />,
						},
					]}
				/>
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
	description: appDetails.appDescription,
	url: appDetails.appUrl,
	applicationCategory: "DeveloperApplication",

	codeRepository: "https://github.com/bcanfield/cronicorn",
	license: "https://opensource.org/licenses/MIT",
	programmingLanguage: ["TypeScript"],
	operatingSystem: "Web Browser",
};
