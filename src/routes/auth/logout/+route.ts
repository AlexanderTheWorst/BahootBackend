import jwtAuth from "@/src/plugins/jwt.auth.js";
import type { FastifyPluginAsync } from "fastify";

export default (async (fastify) => {
  fastify.register(jwtAuth);

  fastify.get("/", (req, res) => {
    if (req.auth.user) {
      console.log("Yo!");

      res.clearCookie("ACCESS_TOKEN", {
        path: "/",
        domain: ".bahoot.local",
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });

      res.clearCookie("REFRESH_TOKEN", {
        path: "/",
        domain: ".bahoot.local",
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });

      throw res.redirect("http://bahoot.local")
    } else return false;
  });
}) satisfies FastifyPluginAsync;
