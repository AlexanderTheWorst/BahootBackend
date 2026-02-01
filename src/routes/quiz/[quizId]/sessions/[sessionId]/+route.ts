import jwtAuth from "@/src/plugins/jwt.auth.js";
import type { FastifyPluginAsync } from "fastify";
import { v7 } from "uuid";

type SessionData = {
  userId: string;
  quizId: string;
  question: number;
  answers: string[];

  finished: boolean;
  correctPercentage?: number;
};

type AnswerAction = {
  action: "Answer";
  choice: string;
};

export default (async (fastify) => {
  fastify.register(jwtAuth);

  // GET /quiz/:quizId/sessions/:sessionId
  // ACTION Fetch session data
  fastify.get("/", async (req, res) => {
    if (!req.auth.user) throw res.status(403);

    const { sessionId } = req.params as { sessionId: string };

    const sessionData = await fastify.redis.get(`sessions:${sessionId}`);

    return res.status(200).send(sessionData);
  });

  // POST /quiz/:quizId/sessions/:sessionId
  // ACTION Handle different request types
  fastify.post("/", async (req, res) => {
    if (!req.auth.user) throw res.status(403);

    const { quizId, sessionId } = req.params as {
      quizId: string;
      sessionId: string;
    };

    const sessionData = JSON.parse(
      (await fastify.redis.get(`sessions:${sessionId}`)) ?? ""
    ) as SessionData;

    if (!sessionData) return;

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

    if (!quiz || quizId !== sessionData.quizId) return;

    const action = req.body as AnswerAction;

    if (action.action == "Answer") {
      const question = quiz?.questions[sessionData.question];

      sessionData.question++;
      sessionData.answers.push(action.choice);

      sessionData.finished = sessionData.question == quiz.questions.length;

      if (sessionData.finished) {
        let totalCorrect = 0;

        quiz.questions.forEach((q, i) => {
            let choice = q.choices.find(c => c.id == sessionData.answers[i] && c.correct);
            if (choice) totalCorrect++;
        })

        sessionData.correctPercentage = totalCorrect / quiz.questions.length;
      }

      await fastify.redis.set(
        `sessions:${sessionId}`,
        JSON.stringify(sessionData satisfies SessionData)
      );

      return res.status(200).send({
        action_response: {
            answered: action.choice,
            correct: question?.choices.filter((c) => c.correct),
        },
        session_data: JSON.parse(await fastify.redis.get(`sessions:${sessionId}`) ?? "")
      });
    }

    if (sessionData.userId !== req.auth.user.id) throw res.status(403);
  });
}) satisfies FastifyPluginAsync;
