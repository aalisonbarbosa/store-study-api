import { prisma } from "../lib/prisma.js";

interface ProductInput {
    title: string;
    description: string;
    price: number;
    imageUrl: string;
    ownerId: string;
    categoryId: string;
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
            }
        });
    },

    async getByUser(ownerId: string) {
        return await prisma.product.findMany({
            where: {
                ownerId,
            }
        });
    },

    async create(data: ProductInput) {
        await prisma.product.create({
            data: data
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
            }
        });
    },

    async approve(id: string) {
        await prisma.product.update({
            where: {
                id,
            },
            data: {
                status: "APPROVED",
            }
        })
    },

    async reject(id: string, reason: string) {
        await prisma.product.update({
            where: {
                id,
            },
            data: {
                status: "REJECTED",
                reason,
            }
        })
    },

    async delete(id: string, ownerId: string) {
        await prisma.product.delete({
            where: {
                id,
                ownerId,
            }
        })
    }
}