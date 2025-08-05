"use client";

import type React from "react";

import { Package, Plus } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";

type EmptyPlaceholderProps = {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export default function EmptyPlaceholder({
  icon = <Package className="w-12 h-12 text-muted-foreground/50" />,
  title = "No items yet",
  description = "Get started by adding your first item. It only takes a few seconds.",
  actionLabel = "Add Item",
  onAction,
  className = "",
}: EmptyPlaceholderProps) {
  return (
    <Card className={`border-dashed border-2 ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-6 rounded-full bg-muted/30 p-6">{icon}</div>

        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>

        <p className="text-muted-foreground mb-6 max-w-sm leading-relaxed">{description}</p>

        {onAction && (
          <Button onClick={onAction} className="gap-2">
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
