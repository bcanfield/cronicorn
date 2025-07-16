import { serve } from "@hono/node-server";
import { app } from "./app";

serve(
  {
    fetch: app.fetch,
    hostname: process.env.API_HOSTNAME,
    port: +process.env.API_PORT!,
  },
  (info) => {
    console.log(`Server is running on ${info.address}:${info.port}`);
  }
);
