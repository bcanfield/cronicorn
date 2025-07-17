import { Hono } from "hono";
import { openAPISpecs, generateSpecs } from "hono-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import usersResolver from "./resolvers/user";
import sessionsResolver from "./resolvers/sessions";
import messagesResolver from "./resolvers/messages";
import jobsResolver from "./resolvers/jobs";
import endpointsResolver from "./resolvers/endpoints";
import contextEntriesResolver from "./resolvers/contextEntries";
import apiKeysResolver from "./resolvers/apiKeys";
import accountsResolver from "./resolvers/accounts";
import healthResolver from "./resolvers/_health";
import docsResolver from "./resolvers/_docs";
import { createMarkdownFromOpenApi } from "@scalar/openapi-to-markdown";
import { authHandler, initAuthConfig, verifyAuth } from "@hono/auth-js";
import GitHub from "@auth/core/providers/github";

export const app = new Hono();
app.use(logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);
app.use(
  "*",
  initAuthConfig((c) => {
    // log secrets

    return {
      secret: c.env.AUTH_SECRET,
      providers: [
        GitHub({
          clientId: process.env.GITHUB_ID,
          clientSecret: process.env.GITHUB_SECRET,
        }),
      ],
      trustHost: true,
      basePath: "/api/auth",
    };
  })
);
app.use("/api/auth/*", authHandler());
app.use("/protected/*", verifyAuth());

const route = app.get(
  "/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Cronicorn API",
        version: "1.0.0",
        description: "API for interacting with Cronicorn",
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
          description: "Cronicorn API Server",
        },
      ],
    },
  })
);

app.route("/docs", docsResolver);
app.route("/health", healthResolver);
app.route("/users", usersResolver);
app.route("/sessions", sessionsResolver);
app.route("/messages", messagesResolver);
app.route("/jobs", jobsResolver);
app.route("/endpoints", endpointsResolver);
app.route("/context-entries", contextEntriesResolver);
app.route("/api-keys", apiKeysResolver);
app.route("/accounts", accountsResolver);

app.route("/health", healthResolver);
app.route("/docs", docsResolver);

const specs = await generateSpecs(app, {
  documentation: {
    info: {
      title: "Cronicorn API",
      version: "1.0.0",
      description: "API for interacting with Cronicorn",
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
        description: "Local server",
      },
    ],
  },
});
const markdown = await createMarkdownFromOpenApi(specs);

/**
 * Register a route to serve the Markdown for LLMs
 *
 * Q: Why /llms.txt?
 * A: It's a proposal to standardise on using an /llms.txt file.
 *
 * @see https://llmstxt.org/
 */
app.get("/llms.txt", (c) => c.text(markdown));
export type AppType = typeof route;
