import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './db/schema'

declare global {
  var __db: ReturnType<typeof drizzle> | undefined
}

export const db =
  globalThis.__db ||
  drizzle(process.env.DATABASE_URL!, { schema })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__db = db
}
