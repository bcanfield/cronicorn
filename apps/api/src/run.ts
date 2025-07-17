import { serve } from "@hono/node-server";
import { app } from "./app";

serve(
  {
    fetch: app.fetch,
    // hostname: process.env.API_HOSTNAME,
    port: process.env.API_PORT ? parseInt(process.env.API_PORT, 10) : 3001,
  },
  (info) => {
    console.log(`Server is running on ${info.address}:${info.port}`);
  }
);
