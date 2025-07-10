"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	LineChart,
	Line,
	Area,
	AreaChart,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { useMetrics } from "@/lib/rest-api-client/hooks/use-stats";

export function UsageMetricsPanel() {
	const { data: metrics, isLoading, error } = useMetrics();

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						Usage Metrics
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-64 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						Usage Metrics
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-destructive">Failed to load metrics</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<BarChart3 className="h-5 w-5" />
					Usage Metrics
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="tokens" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="tokens">Token Usage</TabsTrigger>
						<TabsTrigger value="processing">Processing Time</TabsTrigger>
						<TabsTrigger value="context">Context Size</TabsTrigger>
					</TabsList>

					<TabsContent value="tokens" className="mt-6">
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={metrics?.tokenUsage}>
									<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
									<XAxis dataKey="date" className="text-xs fill-muted-foreground" />
									<YAxis className="text-xs fill-muted-foreground" />
									<Tooltip
										contentStyle={{
											backgroundColor: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "6px",
										}}
									/>
									<Area
										type="monotone"
										dataKey="input"
										stackId="1"
										stroke="hsl(var(--chart-1))"
										fill="hsl(var(--chart-1))"
										fillOpacity={0.6}
									/>
									<Area
										type="monotone"
										dataKey="output"
										stackId="1"
										stroke="hsl(var(--chart-2))"
										fill="hsl(var(--chart-2))"
										fillOpacity={0.6}
									/>
									<Area
										type="monotone"
										dataKey="reasoning"
										stackId="1"
										stroke="hsl(var(--chart-3))"
										fill="hsl(var(--chart-3))"
										fillOpacity={0.6}
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
						<div className="flex justify-center gap-6 mt-4 text-sm">
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-chart-1" />
								<span>Input Tokens</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-chart-2" />
								<span>Output Tokens</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-chart-3" />
								<span>Reasoning Tokens</span>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="processing" className="mt-6">
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={metrics?.processingTime}>
									<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
									<XAxis dataKey="date" className="text-xs fill-muted-foreground" />
									<YAxis
										className="text-xs fill-muted-foreground"
										label={{ value: "Seconds", angle: -90, position: "insideLeft" }}
									/>
									<Tooltip
										contentStyle={{
											backgroundColor: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "6px",
										}}
									/>
									<Line
										type="monotone"
										dataKey="avgTime"
										stroke="hsl(var(--chart-1))"
										strokeWidth={2}
										dot={{ fill: "hsl(var(--chart-1))" }}
									/>
									<Line
										type="monotone"
										dataKey="maxTime"
										stroke="hsl(var(--chart-2))"
										strokeWidth={2}
										strokeDasharray="5 5"
										dot={{ fill: "hsl(var(--chart-2))" }}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
						<div className="flex justify-center gap-6 mt-4 text-sm">
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-chart-1" />
								<span>Average Time</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-3 h-2 bg-chart-2" style={{ borderStyle: "dashed", borderWidth: "1px 0" }} />
								<span>Max Time</span>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="context" className="mt-6">
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={metrics?.contextSize}>
									<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
									<XAxis dataKey="date" className="text-xs fill-muted-foreground" />
									<YAxis
										className="text-xs fill-muted-foreground"
										label={{ value: "KB", angle: -90, position: "insideLeft" }}
									/>
									<Tooltip
										contentStyle={{
											backgroundColor: "hsl(var(--card))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "6px",
										}}
									/>
									<Bar dataKey="avgSize" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
									<Bar dataKey="maxSize" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
								</BarChart>
							</ResponsiveContainer>
						</div>
						<div className="flex justify-center gap-6 mt-4 text-sm">
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded bg-chart-1" />
								<span>Average Size</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded bg-chart-2" />
								<span>Max Size</span>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
