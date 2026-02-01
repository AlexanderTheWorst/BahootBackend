import { QuizType } from "@/prisma/generated/enums.js";
import jwtAuth from "@/src/plugins/jwt.auth.js";
import type { FastifyPluginAsync } from "fastify";

export default (async (fastify) => {
  fastify.register(jwtAuth);

  // POST /quiz/:quizId/questions/:questionId/choices
  // ACTION Create a new choice for question x
  fastify.post("/", async (req, res) => {
    if (!req.auth.user) throw res.status(403);

    const { quizId, questionId } = req.params as { quizId: string, questionId: string };

    const question = await fastify.db.quizQuestion.findFirst({
        select: {
            id: true,
            quizId: true,
            choices: true
        },
        where: {
            id: questionId
        }
    });

    if (!question || question.quizId !== quizId) throw res.status(404);

    const choice = await fastify.db.questionChoice.create({
      data: {
        choice: "Wow, a new choice?!",
        explanation: "Why is this correct?",
        correct: false,
        questionId: question.id,
      },
    });

    return choice;
  });
}) satisfies FastifyPluginAsync;