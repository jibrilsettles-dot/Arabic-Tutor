import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

type Database = DrizzleD1Database<typeof schema>;

// The D1 binding is only available inside a request, so the client is
// resolved on each use. Locally, `next dev` gets a simulated D1 database
// through initOpenNextCloudflareForDev (see next.config.ts).
function current(): Database {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}

export const db = new Proxy({} as Database, {
  get(_, prop) {
    const instance = current();
    const value = Reflect.get(instance, prop);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export * from "./schema";
