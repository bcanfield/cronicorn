import { SessionProvider } from "@hono/auth-js/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react";
import "@workspace/ui/styles/globals.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import queryClient from "@/web/lib/query-client";
import { ThemeProvider } from "@workspace/ui/components/theme-provider";

import App from "./app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <NuqsAdapter>
            <App />
          </NuqsAdapter>
        </SessionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
