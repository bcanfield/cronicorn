"use client";

import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";
import * as React from "react";

import type { DialogOptions, DialogState } from "@/web/components/simple-dialog/simple-dialog-context";

import { DialogContext } from "@/web/components/simple-dialog/simple-dialog-context";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

const typeIcons = {
  default: null,
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
};

const typeColors = {
  default: "",
  info: "text-blue-600",
  success: "text-green-600",
  warning: "text-yellow-600",
  error: "text-red-600",
};

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<DialogState>({
    isOpen: false,
    content: "",
  });

  const showDialog = React.useCallback((options: DialogOptions) => {
    setState({
      isOpen: true,
      title: options.title,
      content: options.content,
      type: options.type || "default",
      showCloseButton: options.showCloseButton ?? true,
      closeButtonText: options.closeButtonText || "Close",
      size: options.size || "md",
    });
  }, []);

  const closeDialog = React.useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeDialog();
    }
  };

  const IconComponent = state.type ? typeIcons[state.type] : null;
  const iconColor = state.type ? typeColors[state.type] : "";

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  const contextValue = React.useMemo(() => ({ showDialog, closeDialog }), [showDialog, closeDialog]);

  return (
    <DialogContext value={contextValue}>
      {children}
      <Dialog open={state.isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className={sizeClasses[state.size || "md"]}>
          <DialogHeader>
            {state.title && (
              <DialogTitle className="flex items-center gap-2">
                {IconComponent && <IconComponent className={`h-5 w-5 ${iconColor}`} />}
                {state.title}
              </DialogTitle>
            )}
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                {typeof state.content === "string" ? <p>{state.content}</p> : state.content}
              </div>
            </DialogDescription>
          </DialogHeader>
          {state.showCloseButton && (
            <DialogFooter>
              <Button onClick={closeDialog} variant="outline">
                {state.closeButtonText}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </DialogContext>
  );
}
