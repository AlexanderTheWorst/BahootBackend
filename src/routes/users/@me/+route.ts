import jwtAuth from "@/src/plugins/jwt.auth.js";
import type { FastifyPluginAsync } from "fastify";

export default (async (fastify) => {
  fastify.register(jwtAuth);

  fastify.get("/", (req, res) => {
    if (req.auth.user) return ({
        ...req.auth.user,
        password: undefined
    })
    else return {}
  });
}) satisfies FastifyPluginAsync;
