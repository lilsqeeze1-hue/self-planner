import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

type RuntimeEnv = {
  DB?: D1Database;
};

export function getDb() {
  const runtimeEnv = (
    globalThis as typeof globalThis & { __VMESTE_ENV__?: RuntimeEnv }
  ).__VMESTE_ENV__;

  if (!runtimeEnv?.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` before using the database.",
    );
  }

  return drizzle(runtimeEnv.DB, { schema });
}
