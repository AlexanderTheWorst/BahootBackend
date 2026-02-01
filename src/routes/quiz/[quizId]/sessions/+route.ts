import jwtAuth from "@/src/plugins/jwt.auth.js";
import type { FastifyPluginAsync } from "fastify";
import { v7 } from "uuid";

export default (async (fastify) => {
  fastify.register(jwtAuth);

  // POST /quiz/:quizId/sessions
  // ACTION Create a new quiz session
  fastify.post("/", async (req, res) => {
    if (!req.auth.user) throw res.status(403);

    const { quizId } = req.params as { quizId: string };

    const quiz = await fastify.db.quiz.findFirst({
      where: {
        id: quizId,
      },
    });

    if (!quiz) throw res.status(404);

    const sessionId = v7();

    fastify.redis.set(
      `sessions:${sessionId}`,
      JSON.stringify({
        quizId,
        userId: req.auth.user.id,

        finished: false,

        question: 0,
        answers: [],
      }),
      {
        expiration: {
          type: "EX",
          value: 1800,
        },
      }
    );

    return res.status(200).send(sessionId);
  });
}) satisfies FastifyPluginAsync;
