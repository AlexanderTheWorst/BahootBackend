import jwtAuth from "@/src/plugins/jwt.auth.js";
import argon2 from "argon2";
import type { FastifyPluginAsync } from "fastify";
import jwt from "jsonwebtoken";

export default (async (fastify) => {
  fastify.register(jwtAuth);

  fastify.post("/", async (req, res) => {
    if (req.auth.user) throw res.redirect(`${req.protocol}://${process.env.WEBSITE_URI!}`);

    const { username, password } = req.body as {
      username: string;
      password: string;
    };

    if (!username || !password)
      throw res.redirect(
        encodeURI(
          `${req.protocol}://${process.env.WEBSITE_URI!}/register?error=Required fields have not been filled out&username=${
            (username ?? "").length ? "true" : "false"
          }&usernameValue=${(username ?? "").length ? username : ""}&password=${
            (password ?? "").length ? "true" : "false"
          }`
        )
      );

    const existingUser = await fastify.db.user.findFirst({
      where: {
        username,
      },
    });

    if (existingUser)
      throw res.redirect(
        encodeURI(
          `${req.protocol}://${process.env.WEBSITE_URI!}/register?error=Username already in use&usernameValue=${username}`
        )
      );

    try {
      const hashedPassword = await argon2.hash(password);

      const user = await fastify.db.user.create({
        data: {
          username,
          password: hashedPassword,
        },
      });

      const access_token = jwt.sign(
        {
          userId: user.id,
        },
        process.env.JWT_ACCESS_TOKEN_SECRET!,
        {
          expiresIn: "10s",
        }
      );

      res.setCookie("ACCESS_TOKEN", access_token, {
        path: "/",
        domain: ".bahoot.local",
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });

      const refresh_token = jwt.sign(
        {
          userId: user.id,
        },
        process.env.JWT_REFRESH_TOKEN_SECRET!,
        {
          expiresIn: "7d",
        }
      );

      res.setCookie("REFRESH_TOKEN", refresh_token, {
        path: "/",
        domain: ".bahoot.local",
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });

      return res.redirect(`${req.protocol}://${process.env.WEBSITE_URI!}`);
    } catch (err) {
      console.warn((err as Error).message);
    }
  });
}) satisfies FastifyPluginAsync;
