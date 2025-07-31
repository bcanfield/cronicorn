import React from "react";

import { ConfirmationContext } from "@/web/components/confirmation-dialog/confirmation-context";

export function useConfirmationDialog() {
  const context = React.useContext(ConfirmationContext);
  if (!context) {
    throw new Error("useConfirmation must be used within a ConfirmationProvider");
  }
  return context;
}
