import Fastify from "fastify";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./routes/auth-routes.js";
import productRoutes from "./routes/product-routes.js";
import fastifyMultipart from "@fastify/multipart";

const fastify = Fastify({
    logger: true,
});

fastify.register(fastifyMultipart, {
    attachFieldsToBody: false,
});

fastify.register(authPlugin);

fastify.register(authRoutes, { prefix: "/api" });
fastify.register(productRoutes, { prefix: "/api" });

fastify.listen({ port: 8080, host: "0.0.0.0" });