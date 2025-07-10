"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, MessageSquare, RefreshCw } from "lucide-react";
import { useStats } from "@/lib/rest-api-client/hooks/use-stats";

export function QuickOverviewPanel() {
	const { data: stats, isLoading, error } = useStats();

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="pb-2">
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardContent className="p-6">
						<p className="text-sm text-destructive">Failed to load stats</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const overviewCards = [
		{
			title: "Total Jobs",
			value: stats?.totalJobs || 0,
			icon: Activity,
			description: "Active and paused jobs",
		},
		{
			title: "Messages Today",
			value: stats?.messagesProcessedToday || 0,
			icon: MessageSquare,
			description: "AI decisions processed",
		},
		{
			title: "Context Updates",
			value: stats?.contextUpdatesLast24h || 0,
			icon: RefreshCw,
			description: "Last 24 hours",
		},
	];

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			{overviewCards.map((card, index) => {
				const Icon = card.icon;
				return (
					<Card key={index}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">{card.title}</CardTitle>
							<Icon className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
							<p className="text-xs text-muted-foreground">{card.description}</p>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
