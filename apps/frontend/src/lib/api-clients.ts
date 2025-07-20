import { createClient } from "@cronicorn/api2/client";
import { getApiUrl } from "./get-api-url";

const baseUrl = getApiUrl();

export const apiClient = createClient(baseUrl);

