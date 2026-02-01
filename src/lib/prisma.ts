// prisma.ts
import { PrismaClient } from "@/prisma/generated/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

console.log({
  database: process.env.DATABASE_NAME!,
  user: process.env.DATABASE_USER!,
  host: process.env.DATABASE_HOST!,
  password: process.env.DATABASE_PASSWORD!,
  port: Number(process.env.DATABASE_PORT!),
  connectionLimit: 20,
});

const adapter = new PrismaMariaDb({
  database: process.env.DATABASE_NAME!,
  user: process.env.DATABASE_USER!,
  host: process.env.DATABASE_HOST!,
  password: process.env.DATABASE_PASSWORD!,
  port: Number(process.env.DATABASE_PORT!),
  connectionLimit: 20,
});

export const prisma = new PrismaClient({
  adapter,
  log: ["error"]
});
