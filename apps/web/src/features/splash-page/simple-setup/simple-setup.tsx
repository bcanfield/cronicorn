import { ArrowRight } from "lucide-react";

import { DOCS_URL } from "@/web/config/config";
import { Button } from "@workspace/ui/components/button";

import { JsonCodeBlock } from "./json-code-block";

type SimpleSetupProps = {
  jsonContent?: object;
  shellCommands?: string[];
  title?: string;
  description?: string;
};

const DEFAULT_JSON_CONTENT = {
  description: "Run system checks every 15 minutes, but switch to every 3 minutes if error rate goes above 2%. Skip checks during maintenance mode.",
  endpoints: [
    {
      name: "Check System Health",
      url: "https://api.example.com/health",
      method: "GET",
    },
    {
      name: "Notify on Error Spike",
      url: "https://hooks.example.com/alert",
      method: "POST",
    },
  ],
};

export default function Component({
  jsonContent = DEFAULT_JSON_CONTENT,
  title = "Define powerful jobs in seconds",
  description = "Just describe what should happen and where to send it.",
}: SimpleSetupProps) {
  return (
    <div className="max-w-5xl w-full text-left mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-medium text-foreground mb-2 leading-tight tracking-tight mt-8">
            {title}
          </h2>
          <p className="text-muted-foreground text-base max-w-2xl">{description}</p>
        </div>
        <Button asChild variant="outline" className="self-start lg:self-auto bg-transparent">
          <a href={DOCS_URL} target="_blank">
            Read the docs
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>

        </Button>
      </div>

      {/* Code Blocks Section */}
      <div className="grid grid-cols-1">
        {/* Left Code Block */}
        <div className="space-y-2">
          <JsonCodeBlock jsonString={JSON.stringify(jsonContent)} />
          <p className="text-muted-foreground font-light text-xs">Defining a Job</p>
        </div>

      </div>
    </div>
  );
}
