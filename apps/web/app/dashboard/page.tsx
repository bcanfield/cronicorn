"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { QuickOverviewPanel } from "@/features/dashboard/components/quick-overview-panel"
import { JobsTablePanel } from "@/features/dashboard/components/jobs-table-panel"
import { RecentActivityPanel } from "@/features/dashboard/components/recent-activity-panel"
import { UsageMetricsPanel } from "@/features/dashboard/components/usage-metrics-panel"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your scheduled jobs and system activity.
          </p>
        </div>

        {/* Quick Overview Panel */}
        <QuickOverviewPanel />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Jobs Table Panel */}
          <div className="lg:col-span-2">
            <JobsTablePanel />
          </div>

          {/* Recent Activity Panel */}
          <RecentActivityPanel />

          {/* Next Scheduled Runs Panel - Using Recent Activity for now */}
          <RecentActivityPanel />
        </div>

        {/* Usage Metrics Panel */}
        <UsageMetricsPanel />

        {/* Create Job CTA */}
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Button size="lg" className="h-12 px-8">
            <Plus className="w-5 h-5 mr-2" />
            Create New Job
          </Button>
          <p className="text-sm text-muted-foreground">Spin up a new job in seconds</p>
        </div>
      </div>
    </div>
  )
}
