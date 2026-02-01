import fastify from "fastify";
import fp from "fastify-plugin";
import jwt, { type JsonWebTokenError } from "jsonwebtoken";

export default fp(async (fastify) => {
  fastify.addHook("onRequest", async (req, res) => {
    req.auth = {};

    const { ACCESS_TOKEN, REFRESH_TOKEN } = req.cookies;

    let newAccessToken: string | undefined;
    let userId: string | undefined;

    // No tokens → just continue request
    if (!ACCESS_TOKEN && !REFRESH_TOKEN) return;

    let refresh_verified: any;
    let refresh_expired = false;

    // ---- VERIFY ACCESS TOKEN ----
    if (ACCESS_TOKEN) {
      try {
        const decoded = jwt.verify(
          ACCESS_TOKEN,
          process.env.JWT_ACCESS_TOKEN_SECRET!
        ) as { userId: string };

        userId = decoded.userId;
      } catch (err) {
        if ((err as JsonWebTokenError).name !== "TokenExpiredError") return;
      }
    }

    // ---- VERIFY REFRESH TOKEN ----
    if (REFRESH_TOKEN) {
      try {
        refresh_verified = jwt.verify(
          REFRESH_TOKEN,
          process.env.JWT_REFRESH_TOKEN_SECRET!
        ) as { userId: string };
      } catch (err) {
        refresh_expired =
          (err as JsonWebTokenError).name === "TokenExpiredError";
      }
    }

    // Access expired but refresh valid → issue new access
    if (!userId && refresh_verified && !refresh_expired) {
      userId = refresh_verified.userId;

      newAccessToken = jwt.sign(
        { userId },
        process.env.JWT_ACCESS_TOKEN_SECRET!,
        { expiresIn: "5m" }
      );
    }

    // Set new access token if refreshed
    if (newAccessToken) {
      res.setCookie("ACCESS_TOKEN", newAccessToken, {
        path: "/",
        domain: ".bahoot.local",
        secure: false,
        httpOnly: true,
        sameSite: "lax",
      });
    }

    // Attach user if we have one
    if (userId) {
      req.auth.user = await fastify.db.user.findUnique({
        where: { id: userId },
      });
    }
  });
});
