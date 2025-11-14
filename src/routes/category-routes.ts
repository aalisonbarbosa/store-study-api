import type { FastifyInstance } from "fastify";
import * as categoryController from "../controllers/category-controller.js";

export default async function categoryRoutes(fastify: FastifyInstance) {
  fastify.get("/categories", categoryController.getCategories);
}
