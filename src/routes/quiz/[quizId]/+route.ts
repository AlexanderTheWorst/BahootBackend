import type { Quiz } from "@/prisma/generated/client.js";
import jwtAuth from "@/src/plugins/jwt.auth.js";
import type { FastifyPluginAsync } from "fastify";

export default (async (fastify) => {
  fastify.register(jwtAuth);

  // GET /quiz/:quizId
  // ACTION Fetch quiz information
  fastify.get("/", async (req, res) => {
    if (!req.auth.user) throw res.status(403);

    const { quizId } = req.params as { quizId: string };

    const quiz = await fastify.db.quiz.findFirst({
      select: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        id: true,
        name: true,
        description: true,
        quizType: true,
        questions: {
          select: {
            question: true,
            description: true,
            id: true,
            choices: true,
          },
        },
      },
      where: { id: quizId },
    });

    if (!quiz) throw res.status(404);

    return {
      ...quiz,
      questions: quiz.questions.map((q) => ({
        ...q,
        choices: q.choices.map((c) => {
          if (quiz.creator.id == req.auth.user?.id) return c;
          return { ...c, correct: undefined };
        }),
      })),
    };
  });

  // PATCH /quiz/:quizId
  // ACTION Update quiz information
  fastify.patch("/", async (req, res) => {
    if (!req.auth.user) throw res.status(403);

    const { quizId } = req.params as {
      quizId: string;
      questionId: string;
      choiceId: string;
    };

    const quiz = await fastify.db.quiz.findFirst({
      where: {
        id: quizId,
      },
    });

    if (!quiz) throw res.status(404);

    const body = req.body as Quiz;

    const restricted = ["id", "questions", "quizType"];

    if (
      restricted.find((opt) => {
        return opt in body;
      })
    )
      throw res.status(403);

    try {
      const data = {
        name: body.name && body.name.trim().length ? body.name : quiz.name,
      };

      await fastify.db.quiz.update({
        where: {
          id: quizId,
        },
        data,
      });

      return res.status(200).send(data);
    } catch (err) {
      throw res.status(500);
    }
  });
}) satisfies FastifyPluginAsync;
