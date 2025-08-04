"use client";

import { signIn } from "@hono/auth-js/react";
import { ArrowRight, Calendar, Clock, Cloud, Code, Database, Timer, Webhook, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { AnimatedTabs } from "@/web/components/animated-tabs";
import DynamicScheduleTimeline from "@/web/features/splash-page/timeline/timeline";
import { monitoringScenarios } from "@/web/features/splash-page/timeline/timeline-scenario-data";
import { TimelineTabs } from "@/web/features/splash-page/timeline/timeline-tabs";
import WorkflowDiagram from "@/web/features/splash-page/workflow-diagram";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";

const tabData = monitoringScenarios.map(scenario => ({
  id: scenario.id,
  label: scenario.name,
  content: <DynamicScheduleTimeline scenario={scenario} />,
  icon: <div className="w-2 h-2 rounded-full bg-current opacity-60" />,
}));

export default function Component() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [activeScenario, setActiveScenario] = useState("system-monitoring");
  const tabData = monitoringScenarios.map(scenario => ({
    id: scenario.id,
    label: scenario.name,
    content: <DynamicScheduleTimeline scenario={scenario} />,
    icon: <div className="w-2 h-2 rounded-full bg-current opacity-60" />,
  }));

  if (!mounted)
    return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Multiple layered blur effects across the screen - restored from previous version */}
      {/* 1. Dark blur on the far left - more visible for contrast */}
      <div
        className="absolute top-0 left-0 w-1/4 h-96 bg-gradient-to-br from-black/95 via-gray-950/80 to-gray-900/50 blur-3xl animate-pulse"
        style={{ animationDuration: "8s" }}
      >
      </div>

      {/* 2. Light blue blur - slightly overlapping */}
      <div
        className="absolute top-0 left-16 w-1/4 h-96 bg-gradient-to-br from-blue-400/30 via-blue-500/22 to-transparent blur-3xl animate-pulse"
        style={{ animationDuration: "6s", animationDelay: "1s" }}
      >
      </div>

      {/* 3. More prominent blue blur */}
      <div
        className="absolute top-0 left-1/4 w-1/3 h-[28rem] bg-gradient-to-br from-blue-500/40 via-blue-600/32 to-transparent blur-3xl animate-pulse"
        style={{ animationDuration: "7s", animationDelay: "2s" }}
      >
      </div>

      {/* 4. Another blue blur - different height */}
      <div
        className="absolute top-0 left-2/5 w-1/4 h-80 bg-gradient-to-br from-blue-400/35 via-blue-500/25 to-transparent blur-3xl animate-pulse"
        style={{ animationDuration: "5s", animationDelay: "3s" }}
      >
      </div>

      {/* 5. Vivid pink blur - more prominent */}
      <div
        className="absolute top-0 right-1/4 w-1/3 h-80 bg-gradient-to-bl from-pink-500/50 via-purple-500/40 to-transparent blur-3xl animate-pulse"
        style={{ animationDuration: "6s", animationDelay: "1.5s" }}
      >
      </div>

      {/* 6. Softer pink blur on the far right */}
      <div
        className="absolute top-0 right-0 w-1/4 h-96 bg-gradient-to-bl from-pink-400/35 via-purple-400/25 to-transparent blur-3xl animate-pulse"
        style={{ animationDuration: "8s", animationDelay: "4s" }}
      >
      </div>

      {/* Background-colored blur behind hero text */}
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-64 bg-black/70 blur-2xl animate-pulse"
        style={{ animationDuration: "10s" }}
      >
      </div>

      {/* Faint particles scattered around */}
      <div className="absolute top-16 left-8 w-1 h-1 bg-blue-400/25 rounded-full"></div>
      <div className="absolute top-32 left-24 w-2 h-2 bg-purple-300/20 rounded-full"></div>
      <div className="absolute top-48 left-16 w-1.5 h-1.5 bg-blue-300/30 rounded-full"></div>
      <div className="absolute top-64 left-32 w-1 h-1 bg-pink-400/25 rounded-full"></div>
      <div className="absolute top-80 left-12 w-2.5 h-2.5 bg-blue-500/15 rounded-full"></div>

      <div className="absolute top-24 right-16 w-1.5 h-1.5 bg-pink-300/25 rounded-full"></div>
      <div className="absolute top-40 right-32 w-1 h-1 bg-blue-400/30 rounded-full"></div>
      <div className="absolute top-56 right-8 w-2 h-2 bg-purple-400/20 rounded-full"></div>
      <div className="absolute top-72 right-24 w-1 h-1 bg-pink-500/25 rounded-full"></div>
      <div className="absolute top-88 right-40 w-1.5 h-1.5 bg-blue-300/20 rounded-full"></div>

      <div className="absolute bottom-16 left-16 w-2 h-2 bg-purple-400/25 rounded-full"></div>
      <div className="absolute bottom-32 left-8 w-1 h-1 bg-blue-500/30 rounded-full"></div>
      <div className="absolute bottom-48 left-28 w-1.5 h-1.5 bg-pink-300/20 rounded-full"></div>
      <div className="absolute bottom-64 left-20 w-1 h-1 bg-blue-400/25 rounded-full"></div>

      <div className="absolute bottom-20 right-12 w-1.5 h-1.5 bg-pink-400/30 rounded-full"></div>
      <div className="absolute bottom-36 right-28 w-1 h-1 bg-blue-300/25 rounded-full"></div>
      <div className="absolute bottom-52 right-16 w-2 h-2 bg-purple-300/20 rounded-full"></div>
      <div className="absolute bottom-68 right-36 w-1 h-1 bg-pink-500/25 rounded-full"></div>

      <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-blue-400/20 rounded-full"></div>
      <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 bg-purple-400/25 rounded-full"></div>
      <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-pink-300/30 rounded-full"></div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative inline-block">
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-r from-black to-black rounded-lg  blur-2xl  scale-105"></div>
              </div>

              <img
                alt="Cronicorn Logo"
                width={50}
                height={50}
                src="/icon.png"
                className="relative z-10 rounded-lg object-cover"
              />
            </div>

            <div className="text-foreground">
              <span className="font-semibold text-lg">Cronicorn</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Documentation
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Examples
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Pricing
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Status
            </a>
          </div>

          {/* CTA Button */}
          <Button
            variant="ghost"
            onClick={() => signIn("github")}
            size="sm"
            className="hover:bg-muted"
          >
            Get Started
          </Button>
        </nav>
      </header>

      {/* Hero Section - Minimalistic */}
      <main className="relative z-10 gap-8 flex flex-col items-center justify-start min-h-[calc(100vh-120px)] px-6 text-center">
        {/* <div className="max-w-4xl mx-auto animate-fade-in"> */}
        <div className="grid max-w-6xl mx-auto  grid-cols-1 lg:grid-cols-2 items-start justify-between w-full gap-12 lg:flex-auto">
          <div className="animate-fade-in">

            {/* Badge */}
            <div className="mb-8">
              <Badge variant="outline" className="px-3 py-1 text-xs border-border">
                <Zap className="w-3 h-3 mr-1" />
                AI-powered dynamic scheduling
              </Badge>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-foreground mb-6 leading-tight tracking-tight">
              Smart cron jobs that
              {" "}
              <span className="font-medium gradient-text">adapt</span>
              {" "}
              to your data
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Schedule tasks dynamically with AI. Send context via API or TypeScript SDK, and let our intelligent
              scheduler handle the rest.
            </p>

            {/* CTA Section */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                Start Scheduling
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground">
                View API Docs
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto text-center">
              <div>
                <div className="text-2xl font-semibold text-foreground">99.9%</div>
                <div className="text-sm text-muted-foreground">Reliability</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">
                  {"<"}
                  1s
                </div>
                <div className="text-sm text-muted-foreground">API Response</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">24/7</div>
                <div className="text-sm text-muted-foreground">Monitoring</div>
              </div>
            </div>
          </div>
          <div className=" flex w-full h-full flex-col max-w-2xl mx-auto">
            {/* Animated Tabs */}
            {/* <Tabs defaultValue="account" className="w-[400px]">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
              </TabsList>
              <TabsContent value="account">Make changes to your account here.</TabsContent>
              <TabsContent value="password">Change your password here.</TabsContent>
            </Tabs> */}
            <TimelineTabs tabs={tabData} defaultTab="system-monitoring" onTabChange={setActiveScenario} variant="default" />
            {/* <DynamicScheduleTimeline scenario={}/> */}

          </div>
        </div>

        {/* Scroll Indicator */}
        {/* <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-10 border border-border rounded-full flex justify-center">
            <div className="w-1 h-3 bg-muted-foreground rounded-full mt-2 animate-bounce"></div>
          </div>
        </div> */}
        {/* <WorkflowDiagram /> */}

      </main>

      {/* AI Cron Service Showcase */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4">Two ways to get started</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose your preferred integration method and start scheduling intelligent tasks in minutes
            </p>
          </div>

          {/* Integration Methods Tabs - Made Responsive */}
          <Card className="mb-20 animate-slide-in">
            <CardHeader>
              <CardTitle className="text-2xl font-light">Integration Options</CardTitle>
              <CardDescription>Simple REST API or full-featured TypeScript SDK</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="api" className="w-full">
                <div className="overflow-x-auto scrollbar-hide">
                  <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground min-w-full sm:min-w-0">
                    <TabsTrigger value="api" className="whitespace-nowrap px-3 py-1.5 text-sm">
                      <Webhook className="w-4 h-4 mr-2" />
                      REST API
                    </TabsTrigger>
                    <TabsTrigger value="sdk" className="whitespace-nowrap px-3 py-1.5 text-sm">
                      <Code className="w-4 h-4 mr-2" />
                      TypeScript SDK
                    </TabsTrigger>
                    <TabsTrigger value="examples" className="whitespace-nowrap px-3 py-1.5 text-sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      Use Cases
                    </TabsTrigger>
                    <TabsTrigger value="monitoring" className="whitespace-nowrap px-3 py-1.5 text-sm">
                      <Timer className="w-4 h-4 mr-2" />
                      Monitoring
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="api" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                        <Webhook className="w-5 h-5 text-accent" />
                        Simple HTTP Requests
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Send a POST request with your task context. Our AI determines the optimal schedule
                        automatically.
                      </p>
                      <div className="code-block">
                        <pre className="text-accent text-xs">
                          {`curl -X POST https://api.cronai.dev/schedule \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task": "send_weekly_report",
    "context": {
      "user_timezone": "America/New_York",
      "preferred_day": "monday",
      "business_hours": true
    },
    "webhook_url": "https://yourapp.com/webhook"
  }'`}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                        <Database className="w-5 h-5 text-accent" />
                        Dynamic Context Updates
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Update task context anytime. The AI automatically adjusts schedules based on new information.
                      </p>
                      <div className="code-block">
                        <pre className="text-accent text-xs">
                          {`// Update existing task context
curl -X PATCH https://api.cronai.dev/tasks/task_123 \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "context": {
      "user_activity": "high",
      "last_engagement": "2024-01-15T10:30:00Z",
      "priority": "urgent"
    }
  }'

// AI automatically reschedules based on new context`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sdk" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                        <Code className="w-5 h-5 text-accent" />
                        Install via NPM
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Full TypeScript support with intelligent autocomplete and type safety.
                      </p>
                      <div className="code-block">
                        <pre className="text-accent text-xs">
                          {`npm install @cronai/sdk

import { CronAI } from '@cronai/sdk';

const cronai = new CronAI({
  apiKey: process.env.CRONAI_API_KEY
});

// Schedule with full type safety
await cronai.schedule({
  task: 'user_onboarding_email',
  context: {
    userSignupDate: new Date(),
    userTimezone: 'UTC-5',
    emailPreference: 'morning'
  }
});`}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-accent" />
                        Advanced Features
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Built-in retry logic, error handling, and real-time status updates.
                      </p>
                      <div className="code-block">
                        <pre className="text-accent text-xs">
                          {`// Advanced scheduling with conditions
const task = await cronai.schedule({
  task: 'inventory_restock_alert',
  context: {
    currentStock: 50,
    reorderPoint: 100,
    supplier: 'acme-corp'
  },
  conditions: {
    onlyIf: 'stock < reorderPoint',
    maxRetries: 3,
    backoffStrategy: 'exponential'
  }
});

// Real-time status monitoring
task.onStatusChange((status) => {
  console.log('Task status:', status);
});`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="examples" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-accent" />
                        Smart Email Campaigns
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        AI analyzes user behavior to send emails at optimal times for maximum engagement.
                      </p>
                      <div className="code-block">
                        <pre className="text-accent text-xs">
                          {`// Context-aware email scheduling
{
  "task": "newsletter_send",
  "context": {
    "user_segments": ["active", "premium"],
    "content_type": "product_update",
    "historical_engagement": {
      "best_day": "tuesday",
      "best_time": "10:00",
      "open_rate": 0.35
    }
  }
}

// AI schedules for Tuesday 10 AM in user's timezone`}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                        <Database className="w-5 h-5 text-accent" />
                        Dynamic Data Processing
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Schedule data processing jobs that adapt to data volume and system load.
                      </p>
                      <div className="code-block">
                        <pre className="text-accent text-xs">
                          {`// Adaptive batch processing
{
  "task": "process_user_analytics",
  "context": {
    "data_volume": "high",
    "system_load": 0.7,
    "priority": "normal",
    "estimated_duration": "45min"
  }
}

// AI schedules during low-traffic hours
// Automatically splits large jobs into smaller batches`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="monitoring" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                        <Timer className="w-5 h-5 text-accent" />
                        Real-time Dashboard
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Monitor all your scheduled tasks with detailed analytics and performance metrics.
                      </p>
                      <div className="code-block">
                        <pre className="text-accent text-xs">
                          {`// Get task status and metrics
GET /api/tasks/analytics

{
  "total_tasks": 1247,
  "success_rate": 99.2,
  "avg_execution_time": "2.3s",
  "next_executions": [
    {
      "task_id": "task_123",
      "scheduled_for": "2024-01-15T14:30:00Z",
      "confidence": 0.95
    }
  ]
}`}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                        <Cloud className="w-5 h-5 text-accent" />
                        Intelligent Alerts
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Get notified about task failures, performance issues, or optimization opportunities.
                      </p>
                      <div className="code-block">
                        <pre className="text-accent text-xs">
                          {`// Webhook notifications
{
  "event": "task_optimization_suggestion",
  "task_id": "weekly_report",
  "message": "Consider moving to Tuesday 9 AM",
  "reason": "23% higher engagement rate",
  "confidence": 0.87,
  "estimated_improvement": "+15% success rate"
}

// Automatic failure recovery with exponential backoff`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <Card className="border-border hover:border-accent/50 transition-colors duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-lg font-medium">AI-Powered Scheduling</CardTitle>
                <CardDescription>
                  Machine learning algorithms analyze context to determine optimal execution times.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:border-accent/50 transition-colors duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-lg font-medium">Dynamic Adaptation</CardTitle>
                <CardDescription>
                  Tasks automatically reschedule based on changing context and performance data.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:border-accent/50 transition-colors duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Database className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-lg font-medium">Enterprise Ready</CardTitle>
                <CardDescription>
                  99.9% uptime SLA with enterprise security, compliance, and dedicated support.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="max-w-2xl mx-auto border-border">
              <CardHeader>
                <CardTitle className="text-2xl font-light">Ready to schedule smarter?</CardTitle>
                <CardDescription className="text-lg">
                  Start with our free tier - no credit card required
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Get API Key
                  </Button>
                  <Button variant="outline" size="lg">
                    View Documentation
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">1000 free executions per month • Upgrade anytime</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
