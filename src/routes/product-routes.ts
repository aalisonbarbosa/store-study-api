import type { FastifyInstance } from "fastify";
import * as productController from "../controllers/product-controller.js";

export default async function productRoutes(fastify: FastifyInstance) {
    fastify.post("/products", { preHandler: [fastify.authenticate], config: { multipart: true } }, productController.create);
}