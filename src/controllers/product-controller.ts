import type { FastifyReply, FastifyRequest } from "fastify";
import { createProductSchema, removeProductSchema, updateProductSchema } from "../schemas/produt-schema.js";
import { productService } from "../services/product-service.js";
import { uploadService } from "../services/upload-service.js";

export async function getApprovedProducts(req: FastifyRequest, reply: FastifyReply) {
  try {
    const products = await productService.getAllApproved();

    return reply.status(200).send(products);
  } catch (err) {
    console.error("Erro ao buscar produtos:", err);
    return reply.status(500).send({ message: "Erro interno no servidor" });
  }
}

export async function getUserProducts(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = req.params;

  try {
    const products = await productService.getByUser(id);

    return reply.status(200).send(products);
  } catch (err) {
    console.error("Erro ao buscar produtos:", err);
    return reply.status(500).send({ message: "Erro interno no servidor" });
  }
}



export async function createProduct(req: FastifyRequest, reply: FastifyReply) {
  try {
    if (!["SELLER", "ADMIN"].includes(req.user.role)) {
      return reply.status(403).send({ message: "Não autorizado." });
    }

    const { fields, fileBuffer, mimetype } = await uploadService.parseMultipartRequest(req);
    uploadService.validateFile(mimetype, fileBuffer);

    const secureUrl = await uploadService.uploadImage(fileBuffer);
    const parseResult = createProductSchema.safeParse(fields);

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map(i => i.message);
      return reply.status(400).send({ message: "Dados inválidos", errors });
    }

    await productService.create({
      ...parseResult.data,
      imageUrl: secureUrl,
      ownerId: req.user.id,
    });

    return reply.status(201).send({ message: "Produto criado com sucesso" });
  } catch (err) {
    console.error("Erro ao criar produto:", err)
    return reply.status(500).send({ message: "Erro interno no servidor" });
  }
}

export async function approveProduct(req: FastifyRequest<{ Params: { productId: string } }>, reply: FastifyReply) {
  const { productId } = req.params;

  if (!productId) {
    return reply.status(400).send({ message: "O campo productId é obrigatório" });
  }

  const user = req.user;

  if (user.role !== "ADMIN") {
    return reply.status(403).send({ message: "Não autorizado." });
  }

  try {
    await productService.approve(productId);

    return reply.status(201).send({ message: "Produto aprovado com sucesso" });
  } catch (err) {
    console.error("Erro ao aprovar produto:", err)
    return reply.status(500).send({ message: "Erro interno no servidor" });
  }
}

export async function rejectProduct(
  req: FastifyRequest<{
    Params: { productId: string },
    Body: { reason: string }
  }>,
  reply: FastifyReply
) {
  const { productId } = req.params;
  const { reason } = req.body;

  if (!productId || !reason) {
    return reply.status(400).send({ message: "Os campos productId e reason são obrigatórios" });
  }

  const user = req.user;

  if (user.role !== "ADMIN") {
    return reply.status(403).send({ message: "Não autorizado." });
  }

  try {
    await productService.reject(productId, reason);

    return reply.status(201).send({ message: "Produto rejeitado com sucesso" });
  } catch (err) {
    console.error("Erro ao rejeitar produto:", err)
    return reply.status(500).send({ message: "Erro interno no servidor" });
  }
}



export async function updateProduct(req: FastifyRequest, reply: FastifyReply) {
  const parseResult = updateProductSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errors = parseResult.error.issues.map(i => i.message);
    return reply.status(400).send({ message: "Dados inválidos", errors });
  }

  const userId = req.user.id;

  try {
    await productService.update({ ...parseResult.data, ownerId: userId });

    return reply.status(204).send({ message: "Produto atualizado com sucesso" });
  } catch (err) {
    console.error("Erro ao atualizar produto:", err);
    return reply.status(500).send({ message: "Erro interno no servidor" });
  }
}



export async function deleteProduct(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parseResult = removeProductSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map(i => i.message);
      return reply.status(400).send({ message: "Dados inválidos", errors });
    }

    const userId = req.user.id;

    await productService.delete(parseResult.data.id, userId);

    return reply.status(204).send({ message: "Produto removido com sucesso" });
  } catch (err) {
    console.error("Erro ao remover produto:", err);
    return reply.status(500).send({ message: "Erro interno no servidor" });
  }
}