"use client";

import * as React from "react";

import { ScrollArea, ScrollBar } from "@workspace/ui/components/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { cn } from "@workspace/ui/lib/utils";

type AnimatedTabsProps = {
  tabs: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
    badge?: string | number;
  }>;
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  variant?: "default" | "pills" | "underline";
};

export function TimelineTabs({ tabs, defaultTab, onTabChange, className }: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={cn("w-full flex flex-col gap-4", className)}>

      <Tabs defaultValue="account" className="w-full" value={activeTab} onValueChange={handleTabChange}>
        {/* <ScrollArea className="rounded-lg bg-background/70 backdrop-blur-xl  border border-border shadow-2xl overflow-y-hidden h-10" style={{}}>
          <div className="w-full relative rounded-lg ">
            <TabsList className="flex absolute bg-transparent h-10 ">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-muted/30 to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-primary/5 to-transparent pointer-events-none" />
              {tabs.map(tab => (
                <TabsTrigger
                  className="data-[state=active]:bg-secondary! "
                  key={`${tab.label}-tab-trigger`}
                  value={tab.id}
                >
                  {tab.label}

                </TabsTrigger>

              ))}
            </TabsList>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea> */}

        <ScrollArea className="rounded-lg bg-background/70 backdrop-blur-xl   shadow-2xl">
          <div className="w-full relative h-10">
            <TabsList className="flex absolute h-10 bg-transparent min-w-full">
              {tabs.map(tab => (
                <TabsTrigger
                  className="data-[state=active]:bg-secondary! text-xs "
                  key={`${tab.label}-tab-trigger`}
                  value={tab.id}
                >
                  {tab.label}

                </TabsTrigger>

              ))}
            </TabsList>
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>

        {/* <TabsList className="bg-background/70 backdrop-blur-xl rounded-lg border border-border shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-muted/30 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-primary/5 to-transparent pointer-events-none" />
          {tabs.map(tab => (
            <TabsTrigger
              className="data-[state=active]:bg-secondary! "
              key={`${tab.label}-tab-trigger`}
              value={tab.id}
            >
              {tab.label}

            </TabsTrigger>

          ))}

        </TabsList> */}
        {tabs.map(tab => (
          <TabsContent key={`${tab.label}-tab-content`} value={tab.id}>
            {tab.content}
          </TabsContent>

        ))}
      </Tabs>

    </div>
  );
}
