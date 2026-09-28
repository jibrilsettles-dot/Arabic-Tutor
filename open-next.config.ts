import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every in-app page is dynamic per learner, so no incremental cache is needed.
export default defineCloudflareConfig({});
