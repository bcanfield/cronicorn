import React from "react";

type ConfirmationOptions = {
    title?: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
};

type ConfirmationContextType = {
    confirm: (options: ConfirmationOptions) => Promise<boolean>;
};
export const ConfirmationContext = React.createContext<ConfirmationContextType | null>(null);
