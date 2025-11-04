import type { FastifyInstance } from "fastify";
import * as orderController from "../controllers/order-controller.js"

export default function orderRoutes(fastify: FastifyInstance) {
    fastify.post("/orders", { preHandler: [fastify.authenticate] }, orderController.confirmOrder);
    fastify.post("/orders/:orderId/confirm-payment", { preHandler: [fastify.authenticate] }, orderController.confirmPayment);
}