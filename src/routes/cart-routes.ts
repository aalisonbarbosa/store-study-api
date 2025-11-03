import type { FastifyInstance } from "fastify";
import * as cartController from "../controllers/cart.controller.js";

export default function CartRoutes(fastify: FastifyInstance) {
    fastify.post("/cart/items", { preHandler: [fastify.authenticate] }, cartController.addProductToCart);
    fastify.put("/cart/items/:productId/decrement", { preHandler: [fastify.authenticate] }, cartController.decrementProductInCart);
    fastify.delete("/cart/items/:productId", { preHandler: [fastify.authenticate] }, cartController.removeProductFromCart);
}