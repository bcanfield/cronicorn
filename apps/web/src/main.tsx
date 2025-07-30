import { SessionProvider } from "@hono/auth-js/react";
import { QueryClientProvider } from "@tanstack/react-query";
import "@workspace/ui/styles/globals.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ConfirmationProvider } from "@/web/components/confirmation-dialog/confirmation-dialog";
import queryClient from "@/web/lib/query-client";
import { ThemeProvider } from "@workspace/ui/components/theme-provider";

import App from "./app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <ConfirmationProvider>
            <App />
          </ConfirmationProvider>
        </SessionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
