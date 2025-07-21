import { SessionProvider } from "@hono/auth-js/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";

import "./index.css";

import { createRoot } from "react-dom/client";

import queryClient from "@/web/lib/query-client";

import App from "./app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </SessionProvider>
  </StrictMode>,
);
