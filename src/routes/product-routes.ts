import type { FastifyInstance } from "fastify";
import * as productController from "../controllers/product-controller.js";

export default async function productRoutes(fastify: FastifyInstance) {
    fastify.get("/products", productController.getApprovedProducts);
    fastify.get("/user/:id/products", { preHandler: [fastify.authenticate] }, productController.getUserProducts);
    
    fastify.post("/products", { preHandler: [fastify.authenticate], config: { multipart: true } }, productController.createProduct);

    fastify.put("/products", { preHandler: [fastify.authenticate] }, productController.updateProduct);
    fastify.put("/products/:productId/approve", { preHandler: [fastify.authenticate] }, productController.approveProduct);
    fastify.put("/products/:productId/reject", { preHandler: [fastify.authenticate] }, productController.rejectProduct);

    fastify.delete("/products", { preHandler: [fastify.authenticate] }, productController.deleteProduct);
}