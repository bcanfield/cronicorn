"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@workspace/ui/components/button";
import { cn, toast } from "@workspace/ui/lib/utils";

type CodeBlockProps = {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
};

export function CodeBlock({ code, language = "javascript", filename, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
    catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className={cn("relative group", className)}>
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted border border-b-0 rounded-t-lg">
          <span className="text-sm font-medium text-muted-foreground">{filename}</span>
          <span className="text-xs text-muted-foreground uppercase">{language}</span>
        </div>
      )}
      <div className="relative">
        <pre
          className={cn(
            "overflow-x-auto p-4 bg-muted/50 border text-sm",
            filename ? "rounded-t-none rounded-b-lg" : "rounded-lg",
          )}
        >
          <code className="text-foreground font-mono">{code}</code>
        </pre>
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={copyToClipboard}
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          <span className="sr-only">Copy code</span>
        </Button>
      </div>
    </div>
  );
}
