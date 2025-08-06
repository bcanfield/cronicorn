import React from "react";

import { DialogContext } from "@/web/components/simple-dialog/simple-dialog-context";

export function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}
