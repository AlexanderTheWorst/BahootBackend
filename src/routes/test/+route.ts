import jwtAuth from "@/src/plugins/jwt.auth.js";
import type { FastifyPluginAsync } from "fastify";
import jwt from "jsonwebtoken";

export default (async (fastify) => {
  fastify.register(jwtAuth);

  fastify.get("/", (req, res) => {
    return req.auth.user;
  });
}) satisfies FastifyPluginAsync;
