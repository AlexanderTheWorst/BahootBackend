// # redis.client.ts -> plugin

import { createClient } from "redis";
import fp from "fastify-plugin";

export default fp((fastify, opts, done) => {
  (async () => {
    const client = await createClient({
      password: process.env.REDIS_PASSWORD!,
    })
      .on("error", (err) => console.log("Redis Client Error", err))
      .connect();

    fastify.decorate("redis", client as any);

    fastify.addHook("onClose", () => {
      client.destroy();
    });

    done();
  })();
});
