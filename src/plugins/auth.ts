import fastifyCookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";
import fastifyPlugin from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export default fastifyPlugin(async (fastify: FastifyInstance, opts) => {
    fastify.register(fastifyCookie);

    fastify.register(fastifyJwt, {
        secret: "super_secret_key",
        cookie: {
            cookieName: "token",
            signed: false
        }
    });

    fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });
});