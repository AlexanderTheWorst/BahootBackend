import type { User } from "@/prisma/generated/client.js";
import type { QuizType } from "@/prisma/generated/enums.js";
import jwtAuth from "@/src/plugins/jwt.auth.js";
import type { FastifyPluginAsync } from "fastify";

export default (async (fastify) => {
    fastify.register(jwtAuth);

    // GET /quiz/all
    // ACTION Create a new quiz
    // QUERY
    // > ?type - QuizType - Not required
    // > ?creator - UserId - Not required
    fastify.get("/", async (req, res) => {
        const { type, creator } = req.query as { type: QuizType, creator: User["id"]};

        try {
            const quizes = await fastify.db.quiz.findMany({
                select: {
                    questions: {
                        select: {
                            question: true,
                            description: true,
                            id: true,
                            choices: {
                                select: {
                                    choice: true,
                                    explanation: true,
                                    id: true
                                }
                            }
                        }
                    },
                    id: true,
                    name: true,
                    description: true,
                    creator: {
                        select: {id: true, username: true}
                    }
                },
                where: {
                    quizType: type,
                    creatorId: creator
                }
            })
    
            return quizes;
        } catch(err) {
            console.log(err);
        }
    });
}) satisfies FastifyPluginAsync;