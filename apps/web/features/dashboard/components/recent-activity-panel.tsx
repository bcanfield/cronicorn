"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, User, Settings, Wrench } from "lucide-react";
import { useMessages } from "@/lib/rest-api-client/hooks/use-messages";
import type { MessageRole } from "@cronicorn/rest-api";

function getRoleIcon(role: MessageRole) {
	switch (role) {
		case "system":
			return Settings;
		case "user":
			return User;
		case "tool":
			return Wrench;
		default:
			return Activity;
	}
}

function getRoleColor(role: MessageRole) {
	switch (role) {
		case "system":
			return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
		case "user":
			return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
		case "tool":
			return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
		default:
			return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
	}
}

function formatTimeAgo(dateString: string) {
	const date = new Date(dateString);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const minutes = Math.floor(diff / (1000 * 60));
	const hours = Math.floor(minutes / 60);

	if (hours > 0) return `${hours}h ago`;
	return `${minutes}m ago`;
}

export function RecentActivityPanel() {
	const { data, isLoading, error } = useMessages({ limit: 5 });

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-3 w-24" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Activity className="h-5 w-5" />
						Recent Activity
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-destructive">Failed to load activity</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Activity className="h-5 w-5" />
					Recent Activity
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{data?.messages.map((message) => {
						const Icon = getRoleIcon(message.role);
						return (
							<div key={message.id} className="flex items-start space-x-3">
								<div className="flex-shrink-0">
									<div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
										<Icon className="h-4 w-4" />
									</div>
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<Badge className={getRoleColor(message.role)}>{message.role}</Badge>
										<span className="text-xs text-muted-foreground">{formatTimeAgo(message.createdAt)}</span>
									</div>
									<p className="text-sm text-foreground leading-relaxed">{message.content}</p>
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
