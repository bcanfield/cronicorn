"use client";

import * as React from "react";

import { ConfirmationContext } from "@/web/components/confirmation-dialog/confirmation-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { buttonVariants } from "@workspace/ui/components/button";

type ConfirmationOptions = {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
};

type ConfirmationState = {
  isOpen: boolean;
  resolve?: (value: boolean) => void;
} & ConfirmationOptions;

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ConfirmationState>({
    isOpen: false,
    description: "",
  });

  const confirm = React.useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title || "Confirm Action",
        description: options.description,
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        variant: options.variant || "default",
        resolve,
      });
    });
  }, []);

  const contextValue = React.useMemo(() => ({ confirm }), [confirm]);

  const handleConfirm = () => {
    state.resolve?.(true);
    setState(prev => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState(prev => ({ ...prev, isOpen: false }));
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    }
  };
  return (
    <ConfirmationContext value={contextValue}>
      {children}
      <AlertDialog open={state.isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{state.title}</AlertDialogTitle>
            <AlertDialogDescription>{state.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>{state.cancelText}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={buttonVariants({
                variant: state.variant,
              })}
            >
              {state.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmationContext>
  );
};
