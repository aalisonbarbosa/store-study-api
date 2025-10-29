import Fastify from "fastify";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./routes/auth-routes.js";

const fastify = Fastify({
    logger: true,
});

fastify.register(authPlugin);

fastify.register(authRoutes, { prefix: "/api" });

fastify.listen({ port: 8080, host: "0.0.0.0" });