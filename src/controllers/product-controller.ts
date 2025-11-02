import type { FastifyReply, FastifyRequest } from "fastify";
import { uploadToCloudinary } from "../lib/upload.js";
import z from "zod";
import { productService } from "../services/product-service.js";

const createProductSchema = z.object({
  title: z.string().min(1, "Nome obrigatório"),
  description: z.string().optional().default(""),
  price: z
    .union([z.string(), z.number()])
    .transform(val => typeof val === "string" ? parseFloat(val) : val)
    .refine(val => val > 0, "Preço inválido"),
  categoryId: z.string().min(1, "CategoryId obrigatório"),
});



export async function getApprovedProducts(req: FastifyRequest, reply: FastifyReply) {
  try {
    const products = await productService.getAllApproved();

    return reply.status(200).send(products);
  } catch (err) {
    console.error("Erro ao buscar produtos:", err);
    return reply.status(500).send({ message: "Erro interno no servidor" });
  }
}



interface UserParams {
  id: string;
}

export async function getUserProducts(req: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) {
  const { id } = req.params;

  try {
    const products = await productService.getByUser(id);

    return reply.status(200).send(products);
  } catch (err) {
    console.error("Erro ao buscar produtos:", err);
    return reply.status(500).send({ message: "Erro interno no servidor" });
  }
}



const allowedMime = ["image/jpeg", "image/png", "image/webp"];
const maxFileSizeBytes = 5 * 1024 * 1024;

export async function createProduct(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;
  if (!["SELLER", "ADMIN"].includes(user.role)) {
    return reply.status(403).send({ message: "Não autorizado." });
  }

  if (!req.isMultipart()) {
    return reply.status(400).send({ message: "Formato multipart/form-data esperado." });
  }

  const parts = req.parts();

  const fields: Record<string, string> = {};
  let uploadError: string | null = null;

  let secureUrl: string | null = null;

  for await (const part of parts) {
    if (uploadError) {
      if (part.type === "file") {
        part.file.resume();
      }
      continue;
    }

    if (part.type === "field") {
      fields[part.fieldname] = String(part.value);
    } else if (part.type === "file") {
      const { filename, mimetype, file } = part;
      if (!filename) {
        uploadError = "Arquivo sem nome.";
        file.resume();
        continue;
      }
      if (!allowedMime.includes(mimetype)) {
        uploadError = `Tipo de arquivo não permitido: ${mimetype}`;
        file.resume();
        continue;
      }

      try {
        const bufferChunks: Buffer[] = [];
        let totalSize = 0;
        for await (const chunk of file) {
          const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
          totalSize += buf.length;
          if (totalSize > maxFileSizeBytes) {
            uploadError = "Arquivo muito grande.";
            break;
          }
          bufferChunks.push(buf);
        }
        if (uploadError) {
          continue;
        }
        const fileBuffer = Buffer.concat(bufferChunks);

        const result = await uploadToCloudinary(fileBuffer, "products");
        secureUrl = result.secure_url;
      } catch (err) {
        uploadError = "Erro no upload do arquivo.";
        console.error("upload file error:", err);
        continue;
      }
    }
  }

  if (uploadError) {
    return reply.status(400).send({ message: "Erro no arquivo", error: uploadError });
  }

  const parseResult = createProductSchema.safeParse(fields);
  if (!parseResult.success) {
    const errors = parseResult.error.issues.map(i => i.message);
    return reply.status(400).send({ message: "Dados inválidos", errors });
  }

  const { title, description, price, categoryId } = parseResult.data;

  if (!secureUrl) {
    return reply.status(400).send({ message: "Arquivo obrigatório." });
  }

  try {
    await productService.create({
      title,
      description,
      price,
      imageUrl: secureUrl,
      ownerId: user.id,
      categoryId,
    });

    return reply.status(201).send({ message: "Produto criado com sucesso" });
  } catch (err) {
    console.error("Erro ao registrar produto:", err);
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

export async function rejectProduct(req: FastifyRequest<{ Params: { productId: string }, Body: { reason: string } }>, reply: FastifyReply) {
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



const updateProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number()
});

export async function updateProduct(req: FastifyRequest, reply: FastifyReply) {
  const parseResult = updateProductSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errors = parseResult.error.issues.map(i => i.message);
    return reply.status(400).send({ message: "Dados inválidos", errors });
  }

  const { id, title, description, price } = parseResult.data;

  const userId = req.user.id;

  try {
    await productService.update({ id, title, description, price, ownerId: userId });

    return reply.status(204).send({ message: "Produto atualizado com sucesso" });
  } catch (err) {
    console.error("Erro ao atualizar produto:", err);
    return reply.status(500).send({ message: "Erro interno no servidor" });
  }
}



const removeProductSchema = z.object({
  id: z.string(),
});

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