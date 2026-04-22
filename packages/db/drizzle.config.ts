import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'db.raudmopfohcvcwqvkxzq.supabase.co',
    port: 5432,
    user: 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD || '',
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false,
    },
  },
})