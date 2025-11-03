import type { FastifyInstance } from "fastify";
import * as cartController from "../controllers/cart.controller.js";

export default function CartRoutes(fastify: FastifyInstance) {
    fastify.post("/cart/add", {preHandler:[fastify.authenticate]}, cartController.addProductToCart);
}