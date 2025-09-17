import createClient from "openapi-fetch";
import type { paths } from "./mini-server.schema";
import CONFIG from "../config";

export const miniServer = createClient<paths>({
  baseUrl: CONFIG.API.BASE_URL,
});
