import React from "react";

export type DialogOptions = {
  title?: string;
  content: React.ReactNode;
  type?: "default" | "info" | "success" | "warning" | "error";
  showCloseButton?: boolean;
  closeButtonText?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

type DialogContextType = {
  showDialog: (options: DialogOptions) => void;
  closeDialog: () => void;
};

export type DialogState = {
  isOpen: boolean;
} & DialogOptions;

export const DialogContext = React.createContext<DialogContextType | null>(null);
