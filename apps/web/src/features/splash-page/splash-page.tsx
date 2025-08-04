"use client";

import { signIn } from "@hono/auth-js/react";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import { DOCS_URL } from "@/web/config/config";
import SimpleSetup from "@/web/features/splash-page/simple-setup/simple-setup";
import DynamicScheduleTimeline from "@/web/features/splash-page/timeline/timeline";
import { monitoringScenarios } from "@/web/features/splash-page/timeline/timeline-scenario-data";
import { TimelineTabs } from "@/web/features/splash-page/timeline/timeline-tabs";
import { Button } from "@workspace/ui/components/button";

import AppLogo from "../../../public/horn.svg?react";

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
    <div className="min-h-screen bg-background relative overflow-hidden mb-8">
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
        <nav className="flex items-center justify-between max-w-7xl mx-auto gap-8">
          {/* Logo */}
          <div className="flex items-center space-x-0">
            <div className="relative inline-block">
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-r from-black to-black rounded-lg  blur-2xl  scale-105"></div>
              </div>

              {/* <img
                alt="Cronicorn Logo"
                width={50}
                height={50}
                src="/horn.svg"
                className="relative z-10 rounded-lg object-cover fill-red-500"
              /> */}
              <AppLogo className="size-6 text-foreground " />
            </div>

            <div className="text-foreground">
              <span className="font-semibold text-lg">Cronicorn</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex md:flex-auto items-center space-x-8">
            <a href={DOCS_URL} target="_blank" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Docs
            </a>
            {/* <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Examples
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Pricing
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Status
            </a> */}
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

        {/* hero */}
        <div className="grid max-w-4xl mx-auto  grid-cols-1 items-start justify-between w-full gap-12 lg:flex-auto">
          <div className="animate-fade-in">

            {/* Badge */}
            {/* <div className="mb-8">
              <Badge variant="outline" className="px-3 py-1 text-xs border-border">
                <Zap className="w-3 h-3 mr-1" />
                For devs who'd rather ship than babysit schedules.
                {" "}
                {" "}

              </Badge>
            </div> */}

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl font-medium text-foreground mb-2 leading-tight tracking-tight mt-8">
              {/* Smart cron jobs that
              {" "}
              <span className="font-medium gradient-text">adapt</span>
              {" "}
              to your data */}
              Done writing schedulers?
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl mx-auto text-foreground/70 mb-6 font-light leading-relaxed">
              {/* Schedule tasks dynamically with AI. Send context via API or TypeScript SDK, and let our intelligent
              scheduler handle the rest. */}
              {/* One description, a few endpoints, and you're live — no maintenance scripts. */}
              Good. We'll take it from here.

            </p>
            <p className="text-sm  text-foreground mb-12 max-w-xl mx-auto font-light leading-relaxed">
              {/* Schedule tasks dynamically with AI. Send context via API or TypeScript SDK, and let our intelligent
              scheduler handle the rest. */}
              {/* One description, a few endpoints, and you're live — no maintenance scripts. */}
              <span className="text-foreground font-semibold">
                Cronicorn
              </span>
              {" "}
              is the adaptive scheduling engine for real-world systems and teams.
            </p>

            {/* CTA Section */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                Start Scheduling
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button asChild variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground">
                <a href={DOCS_URL} target="_blank">
                  View API Docs
                </a>
              </Button>
            </div>

            {/* Quick Stats */}
            {/* <div className="grid grid-cols-3 gap-8 max-w-md mx-auto text-center">
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
            </div> */}
          </div>

        </div>

        {/* Scroll Indicator */}
        {/* <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-10 border border-border rounded-full flex justify-center">
            <div className="w-1 h-3 bg-muted-foreground rounded-full mt-2 animate-bounce"></div>
          </div>
        </div> */}
        {/* <WorkflowDiagram /> */}
        <div className=" flex w-full h-full  max-w-5xl mx-auto">
          {/* Animated Tabs */}
          {/* <Tabs defaultValue="account" className="w-[400px]">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
              </TabsList>
              <TabsContent value="account">Make changes to your account here.</TabsContent>
              <TabsContent value="password">Change your password here.</TabsContent>
            </Tabs> */}
          {/* <DynamicScheduleTimeline scenario={}/> */}

        </div>
        <TimelineTabs tabs={tabData} defaultTab="system-monitoring" onTabChange={setActiveScenario} variant="default" />

        <SimpleSetup />

      </main>

      {/* <HowItWorks /> */}

      {/* AI Cron Service Showcase */}
    </div>
  );
}
