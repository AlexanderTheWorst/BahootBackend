import Fastify, { type FastifyPluginAsync } from "fastify";

import fs, { stat } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import prismaClient from "./plugins/prisma.client.js";
import { config } from "dotenv";
import fastifyFormbody from "@fastify/formbody";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import redisClient from "./plugins/redis.client.js";

config({
  quiet: true,
  path: "./.env",
});

const fastify = Fastify();

await fastify.register(fastifyCors, {
  origin: [`http://${process.env.WEBSITE_URI!}`, `https://${process.env.WEBSITE_URI!}`], // allow your frontend
  methods: ["PATCH", "PUT", "GET", "POST", "DELETE"],
  credentials: true, // if you send cookies
});

await fastify.register(prismaClient);
await fastify.register(redisClient);
await fastify.register(fastifyCookie, {
  secret: process.env.FASTIFY_COOKIES_SECRET!, // for cookies signature
  hook: "onRequest", // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
  parseOptions: {}, // options for parsing cookies
});
await fastify.register(fastifyFormbody);

fastify.decorate("opts", {
  port: 3000,
});

fastify.register((fastify, opts, done) => {
  const routes: Promise<{ route: string; callable: FastifyPluginAsync }>[] = [];

  const files = fs
    .readdirSync(path.join(import.meta.dirname, "routes"), { recursive: true })
    .filter((file) => {
      const absPath = path.join(import.meta.dirname, "routes", file.toString());
      const stats = fs.statSync(absPath);
      return !stats.isDirectory() && path.basename(absPath) == "+route.ts";
    });

  files.forEach((file) => {
    file = file.toString();

    const absPath = path.join(import.meta.dirname, "routes", file);

    const normalized = path.normalize(file);
    const segments = normalized.split(path.sep);
    const fileName = segments.pop();

    const stack: string[] = [];

    for (let seg of segments) {
      const paramTest = /\[(\w+)]/g.exec(seg);
      if (!paramTest) stack.push(seg);
      else {
        const paramName = paramTest[1];
        stack.push(`:${paramName}`);
      }
    }

    routes.push(
      (async () => ({
        route: stack.join("/"),
        callable: (await import(String(pathToFileURL(absPath)))).default,
      }))()
    );
  });

  (async () => {
    try {
      const promisedRoutes = await Promise.all(routes);

      for (const route of promisedRoutes) {
        fastify.register(route.callable, {
          prefix: `/${route.route}`,
        });
      }

      done();
    } catch (err) {
      done(err as Error);
    }
  })();
}, {});

(async () => {
  await fastify.ready();

  fastify
    .listen({
      port: fastify.opts.port,
    })
    .then(() => {
      console.log(`Listening to port ${fastify.opts.port}`);
    });
})();
