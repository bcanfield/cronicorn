import { SessionProvider } from "@hono/auth-js/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import "@workspace/ui/globals.css";
import { createRoot } from "react-dom/client";

import queryClient from "@/web/lib/query-client";
import { DataTableNuqsAdapter } from "@workspace/ui/features/data-table/data-table-nuqs-adapter";

import App from "./app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <DataTableNuqsAdapter>
          <App />
        </DataTableNuqsAdapter>
      </SessionProvider>
    </QueryClientProvider>
  </StrictMode>,
);
