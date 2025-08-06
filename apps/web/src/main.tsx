import { SessionProvider } from "@hono/auth-js/react";
import { QueryClientProvider } from "@tanstack/react-query";
import "@workspace/ui/styles/globals.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ConfirmationProvider } from "@/web/components/confirmation-dialog/confirmation-dialog";
import { DialogProvider } from "@/web/components/simple-dialog/simple-dialog";
import { TailwindIndicator } from "@/web/components/tailwind-indicator";
import queryClient from "@/web/lib/query-client";
import { Toaster } from "@workspace/ui/components/sonner";
import { ThemeProvider } from "@workspace/ui/components/theme-provider";

import App from "./app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <ConfirmationProvider>
            <DialogProvider>
              <App />
              <TailwindIndicator />
              <Toaster />
            </DialogProvider>
          </ConfirmationProvider>
        </SessionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
