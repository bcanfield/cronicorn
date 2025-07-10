import type { RestApiType } from "@cronicorn/rest-api";
import { hc } from "hono/client";

const restApi = hc<RestApiType>("");

export const api = restApi.api.hono.api.hono;
