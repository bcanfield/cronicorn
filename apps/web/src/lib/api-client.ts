import apiClient from "@tasks-app/api-client";

import { API_URL } from "../config/config";

// Use the full API URL instead of a relative path
export default apiClient(API_URL);
