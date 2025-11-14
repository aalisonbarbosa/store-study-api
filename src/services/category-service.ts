import { prisma } from "../lib/prisma.js";

export const categoryService = {
  async getCategories() {
    return await prisma.category.findMany();
  },
};
