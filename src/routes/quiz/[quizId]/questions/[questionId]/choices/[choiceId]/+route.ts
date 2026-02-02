import type { QuestionChoice } from "@/prisma/generated/client.js";
import jwtAuth from "@/src/plugins/jwt.auth.js";
import type { FastifyPluginAsync } from "fastify";

export default (async (fastify) => {
  fastify.register(jwtAuth);

  // DELETE /quiz/:quizId/questions/:questionId/choice/:choiceId
  // ACTION Delete choice from question x
  fastify.delete("/", async (req, res) => {
    if (!req.auth.user) throw res.status(403);

    const { quizId, questionId, choiceId } = req.params as {
      quizId: string;
      questionId: string;
      choiceId: string;
    };

    const quiz = await fastify.db.quiz.findFirst({
      select: {
        creator: true,
        id: true
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

    if (question?.quizId !== quiz.id) throw res.status(404);
    if (!question) throw res.status(404);

    const choice = await fastify.db.questionChoice.findFirst({
        where: {
            id: choiceId
        }
    })

    if (!choice) throw res.status(404);

    try {
      await fastify.db.$transaction([
        fastify.db.questionChoice.delete({ where: { id: choiceId } }),
      ]);

      return res.status(200).send(true);
    } catch (err) {
      console.log(err);

      throw res.status(500);
    }
  });

  // PATCH /quiz/:quizId/questions/:questionId/choices/:choiceID
  // ACTION Update choice information
  fastify.patch("/", async (req, res) => {
    if (!req.auth.user) throw res.status(403);

    const { quizId, questionId, choiceId } = req.params as {
      quizId: string;
      questionId: string;
      choiceId: string;
    };

    const quiz = await fastify.db.quiz.findFirst({
      select: {
        creator: true,
        id: true,
      },
      where: {
        id: quizId,
      },
    });

    if (!quiz) throw res.status(403);
    if (quiz?.creator.id !== req.auth.user.id) throw res.status(403);

    const question = await fastify.db.quizQuestion.findFirst({
      select: {
        quizId: true,
        id: true,
      },
      where: {
        id: questionId,
        quizId,
      },
    });

    if (!question) throw res.status(404);

    const choice = await fastify.db.questionChoice.findFirst({
      where: {
        questionId: question.id,
        id: choiceId,
      },
    });

    if (!choice) throw res.status(404);

    const body = req.body as QuestionChoice;

    const restricted = ["id", "question", "questionId"];

    if (
      restricted.find((opt) => {
        return opt in body;
      })
    )
      throw res.status(403);

    try {
      const data = {
        choice:
          body.choice && body.choice.trim().length > 0
            ? body.choice
            : choice.choice,
        explanation:
          body.explanation && body.explanation.trim().length > 0
            ? body.explanation
            : choice.explanation,
        correct: body.correct
      };

      await fastify.db.questionChoice.update({
        where: {
          id: choiceId,
        },
        data,
      });

      return res.status(200).send(data);
    } catch (err) {
      throw res.status(500).send(choice);
    }
  });
}) satisfies FastifyPluginAsync;
