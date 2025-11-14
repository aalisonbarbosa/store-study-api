import { prisma } from "../lib/prisma.js";

interface ProductInput {
  title: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  ownerId: string;
  categoryId: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
}

interface ProductUpdate {
  id: string;
  title: string;
  description: string;
  price: number;
  ownerId: string;
}

export const productService = {
  async getAllApproved() {
    return await prisma.product.findMany({
      where: {
        status: "APPROVED",
      },
      include: {
        Category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  async getAllPending() {
    return await prisma.product.findMany({
      where: {
        status: "PENDING",
      },
    });
  },

  async getByUser(ownerId: string) {
    return await prisma.product.findMany({
      where: {
        ownerId,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
          },
        },
        Category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  async getById(id: string) {
    return await prisma.product.findFirst({
      where: {
        id,
      },
    });
  },

  async create(data: ProductInput) {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: data.ownerId } });

      if (!user) return new Error("Usuario não encontrado");

      if (user.role === "ADMIN") {
        data = { ...data, status: "APPROVED" };
      }

      await tx.product.create({
        data: data,
      });
    });
  },

  async update(data: ProductUpdate) {
    const { id, ownerId, ...rest } = data;

    await prisma.product.update({
      where: {
        id,
        ownerId,
      },
      data: {
        ...rest,
      },
    });
  },

  async approve(id: string) {
    await prisma.product.update({
      where: {
        id,
      },
      data: {
        status: "APPROVED",
      },
    });
  },

  async reject(id: string, reason: string) {
    await prisma.product.update({
      where: {
        id,
      },
      data: {
        status: "REJECTED",
        reason,
      },
    });
  },

  async delete(id: string, ownerId: string) {
    await prisma.product.delete({
      where: {
        id,
        ownerId,
      },
    });
  },
};
