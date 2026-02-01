import type { PrismaClient } from "@/prisma/generated/client.ts";
import type { RedisClientType } from "redis";

declare module "fastify" {
  interface FastifyInstance {
    opts: {
      port: number;
    };

    db: PrismaClient;
    redis: RedisClientType<any>;
  }

  interface FastifyRequest {
    auth: {
      user?: {
        id: string;
        username: string;
        password: string;
      } | null;
    };
  }
}

export {};
