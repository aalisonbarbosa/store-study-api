import fastifyPlugin from "fastify-plugin";
import { prisma } from "../lib/prisma.js";
import type { FastifyInstance } from "fastify";

export default fastifyPlugin(async (fastify: FastifyInstance) => {
    fastify.decorate("db", prisma);
})