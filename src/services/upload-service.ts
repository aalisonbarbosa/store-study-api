import type { FastifyRequest } from "fastify";
import { uploadToCloudinary } from "../lib/upload.js";

const allowedMime = ["image/jpeg", "image/png", "image/webp"];
const maxFileSizeBytes = 5 * 1024 * 1024;

async function readFileBuffer(file: NodeJS.ReadableStream): Promise<Buffer> {
  const bufferChunks: Buffer[] = [];
  let totalSize = 0;

  for await (const chunk of file) {
    const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    totalSize += buf.length;
    if (totalSize > maxFileSizeBytes) throw { status: 400, message: "Arquivo muito grande." };
    bufferChunks.push(buf);
  }

  return Buffer.concat(bufferChunks);
}

export const uploadService = {
  async parseMultipartRequest(req: FastifyRequest) {
    if (!req.isMultipart()) {
      throw { status: 400, message: "Formato multipart/form-data esperado." };
    }

    const parts = req.parts();
    const fields: Record<string, string> = {};
    let fileBuffer: Buffer | null = null;
    let mimetype: string | null = null;

    for await (const part of parts) {
      if (part.type === "field") {
        fields[part.fieldname] = String(part.value);
      } else if (part.type === "file") {
        if (!part.filename) throw { status: 400, message: "Arquivo sem nome." };
        mimetype = part.mimetype;
        fileBuffer = await readFileBuffer(part.file);
      }
    }

    if (!fileBuffer || !mimetype) {
      throw { status: 400, message: "Arquivo obrigatório." };
    }

    return { fields, fileBuffer, mimetype };
  },

  validateFile(mimetype: string, fileBuffer: Buffer) {
    if (!allowedMime.includes(mimetype)) {
      throw { status: 400, message: `Tipo de arquivo não permitido: ${mimetype}` };
    }
    if (!fileBuffer || fileBuffer.length === 0) {
      throw { status: 400, message: "Arquivo vazio." };
    }
  },

  async uploadImage(fileBuffer: Buffer): Promise<string> {
    try {
      const result = await uploadToCloudinary(fileBuffer, "products");
      return result.secure_url;
    } catch (err) {
      console.error("Erro no upload:", err);
      throw { status: 500, message: "Erro no upload do arquivo." };
    }
  },
};
