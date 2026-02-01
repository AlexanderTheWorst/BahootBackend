import type { FastifyPluginAsync } from "fastify";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import jwtAuth from "@/src/plugins/jwt.auth.js";

export default (async (fastify) => {
  fastify.register(jwtAuth);

  fastify.post("/", async (req, res) => {
    if (req.auth.user) return res.redirect(`${req.protocol}://${process.env.WEBSITE_URI!}`);

    const { username, password } = req.body as {
      username: string;
      password: string;
    };

    if (!username || !password)
      return res.redirect(
        encodeURI(
          `${req.protocol}://${process.env.WEBSITE_URI!}/login?error=Missing required credentials&username=${
            (username ?? "").length ? "true" : "false"
          }&usernameValue=${(username ?? "").length ? username : ""}&password=${
            (password ?? "").length ? "true" : "false"
          }`
        )
      );

    console.log(username, password);

    const user = await fastify.db.user.findFirst({
      select: { id: true, username: true, password: true },
      where: { username },
    });

    console.log(user);

    if (!user)
      return res.redirect(
        encodeURI(
          `${req.protocol}://${process.env.WEBSITE_URI!}/login?error=There is no user with the username ${username}&username=${
            (username ?? "").length ? "true" : "false"
          }&usernameValue=${(username ?? "").length ? username : ""}&password=${
            (password ?? "").length ? "true" : "false"
          }`
        )
      );

    const verified = await argon2.verify(user.password, password);
    if (!verified)
      return res.redirect(
        encodeURI(
          `${req.protocol}://${process.env.WEBSITE_URI!}/login?error=Incorrect username or password&username=${
            (username ?? "").length ? "true" : "false"
          }&usernameValue=${(username ?? "").length ? username : ""}&password=${
            (password ?? "").length ? "true" : "false"
          }`
        )
      );

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
  });
}) satisfies FastifyPluginAsync;
