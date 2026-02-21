import { createDb } from "@hackathon/db";
import { env } from "./env";

export const db = createDb(env.databaseUrl);
