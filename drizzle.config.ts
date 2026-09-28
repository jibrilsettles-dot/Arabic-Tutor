import { defineConfig } from "drizzle-kit";

// Generates SQL migrations into ./drizzle, which Wrangler applies to D1:
//   npm run db:generate   (after changing src/lib/db/schema.ts)
//   npm run db:migrate:local / db:migrate:remote
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
});
