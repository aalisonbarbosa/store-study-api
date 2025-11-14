import z from "zod";

export const createProductSchema = z.object({
  title: z.string().min(1, "Nome obrigatório"),
  description: z.string().optional().default(""),
  price: z.union([z.string(), z.number()])
    .transform(val => typeof val === "string" ? parseFloat(val) : val)
    .refine(val => val > 0, "Preço inválido"),
  categoryId: z.string().min(1, "CategoryId obrigatório"),
  stock: z.union([z.string(), z.number()])
    .transform(val => typeof val === "string" ? parseFloat(val) : val)
    .refine(val => val > 0, "Estoque deve ser no minimo 1"),
});

export const updateProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number()
});