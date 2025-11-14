import type { FastifyReply, FastifyRequest } from "fastify";
import { categoryService } from "../services/category-service.js";

export async function getCategories(req: FastifyRequest, reply: FastifyReply) {
  try {
    const categories = await categoryService.getCategories();

    return reply.status(200).send(categories);
  } catch (err) {
    console.error(err);
    return reply.status(500).send([]);
  }
}
