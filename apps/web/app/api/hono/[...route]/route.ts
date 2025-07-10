import { app, vercelHandle } from "@cronicorn/rest-api";

export const runtime = "edge";

export const GET = vercelHandle(app);
export const POST = vercelHandle(app);
