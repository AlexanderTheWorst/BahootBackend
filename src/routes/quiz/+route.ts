import { QuizType } from "@/prisma/generated/enums.js";
import jwtAuth from "@/src/plugins/jwt.auth.js";
import type { FastifyPluginAsync } from "fastify";

export default (async (fastify) => {
    fastify.register(jwtAuth);

    // POST /quiz/
    // ACTION Create a new quiz
    fastify.post("/", async (req, res) => {
        if (!req.auth.user) throw res.status(403);

        const { type }= req.body as {
            type: "Quiz"
        }

        const quiz = await fastify.db.quiz.create({
            data: {
                name: `${req.auth.user.username}'s fantastical quiz!`,
                description: "Your description of the quiz!",
                quizType: QuizType[type],
                creatorId: req.auth.user.id
            }
        });

        const question = await fastify.db.quizQuestion.create({
            data: {
                question: "What is the capital of France?",
                description: "The big city in France...",
                quizId: quiz.id,
            }
        });

        for (let i = 1; i < 5; i++) {
            await fastify.db.questionChoice.create({
                data: {
                    correct: i % 2 == 0,
                    choice: `Choice ${i}`,
                    questionId: question.id,
                    explanation: `This is just what is shown if it's picked!`
                }
            });
        }

        const question2 = await fastify.db.quizQuestion.create({
            data: {
                question: "First question!",
                quizId: quiz.id,
                description: "Rahhhh"
            }
        });

        for (let i = 1; i < 5; i++) {
            await fastify.db.questionChoice.create({
                data: {
                    choice: `Choice ${i}`,
                    questionId: question2.id,
                    explanation: `This is just what is shown if it's picked!`
                }
            });
        }

        return quiz
    });
}) satisfies FastifyPluginAsync;