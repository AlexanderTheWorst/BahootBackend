import type { QuizQuestion } from "@/prisma/generated/client.js";
import jwtAuth from "@/src/plugins/jwt.auth.js";
import type { FastifyPluginAsync } from "fastify";

export default (async (fastify) => {
  fastify.register(jwtAuth);

  // DELETE /quiz/:quizId/questions/:questionId
  // ACTION Delete question from quiz x
  fastify.delete("/", async (req, res) => {
    if (!req.auth.user) throw res.status(403);

    const { quizId, questionId } = req.params as {
      quizId: string;
      questionId: string;
    };

    const quiz = await fastify.db.quiz.findFirst({
      select: {
        id: true,
        creator: true
      },
      where: {
        id: quizId,
      },
    });

    if (!quiz) throw res.status(404);
    if (quiz?.creator.id !== req.auth.user.id) throw res.status(403);

    const question = await fastify.db.quizQuestion.findFirst({
      where: {
        id: questionId,
      },
    });

    if (!question) throw res.status(404);

    try {
      await fastify.db.$transaction([
        fastify.db.quizQuestion.delete({ where: { id: questionId } }),
      ]);

      return res.status(200).send(true);
    } catch (err) {
      console.log(err);

      throw res.status(500);
    }
  });

  // PATCH /quiz/:quizId/questions/:questionId
  // ACTION Update question information
  fastify.patch("/", async (req, res) => {
    if (!req.auth.user) throw res.status(403);

    const { quizId, questionId } = req.params as {
      quizId: string;
      questionId: string;
    };

    const quiz = await fastify.db.quiz.findFirst({
      select: {
        id: true,
        creator: true
      },
      where: {
        id: quizId,
      },
    });

    if (!quiz) throw res.status(404);
    if (quiz?.creator.id !== req.auth.user.id) throw res.status(403);

    const question = await fastify.db.quizQuestion.findFirst({
      where: {
        id: questionId,
        quizId,
      },
    });

    if (!question) throw res.status(404);

    const body = req.body as QuizQuestion;

    const restricted = ["id", "quizId", "quiz"];

    if (
      restricted.find((opt) => {
        return opt in body;
      })
    )
      throw res.status(403);

    try {
      const data = {
        question:
          body.question && body.question.trim().length > 0
            ? body.question
            : question.question,
        description:
          body.description && body.description.trim().length > 0
            ? body.description
            : question.description,
      };

      await fastify.db.quizQuestion.update({
        where: {
          id: questionId,
        },
        data,
      });

      return res.status(200).send(data);
    } catch (err) {
      console.log(err);
      throw res.status(500).send(question);
    }
  });
}) satisfies FastifyPluginAsync;
