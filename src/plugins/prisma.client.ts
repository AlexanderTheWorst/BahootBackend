// # prisma.client.ts -> plugin

import fp from "fastify-plugin";

export default fp((fastify, opts, done) => {
  (async () => {
    const { prisma } = await import("@/src/lib/prisma.js");

    fastify.decorate("db", prisma);

    fastify.addHook("onClose", () => {
      prisma.$disconnect();
    });

    done();
  })();
});
