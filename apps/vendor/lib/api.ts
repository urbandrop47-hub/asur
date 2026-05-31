import { createApiClient } from "@asur/api-client";
import { readVendorToken } from "./auth-storage";

export const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  getAuthToken: readVendorToken
});
