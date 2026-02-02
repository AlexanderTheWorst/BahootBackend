import { QuizType } from "@/prisma/generated/enums.js";
import jwtAuth from "@/src/plugins/jwt.auth.js";
import type { FastifyPluginAsync } from "fastify";

export default (async (fastify) => {
  fastify.register(jwtAuth);

  // POST /quiz/:quizId/questions
  // ACTION Create a new question for quiz x
  fastify.post("/", async (req, res) => {
    if (!req.auth.user) throw res.status(403);

    const { quizId } = req.params as { quizId: string };

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

    const question = await fastify.db.quizQuestion.create({
      data: {
        question: "What is the capital of France?",
        description: "The big city in France...",
        quizId: quiz.id,
      },
    });

    const choice = await fastify.db.questionChoice.create({
      data: {
        choice: "Your first choice!",
        explanation: "Why is this correct?",
        correct: false,
        questionId: question.id,
      },
    });

    return { ...question, choices: [choice] };
  });
}) satisfies FastifyPluginAsync;
