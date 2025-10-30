import { prisma } from "../lib/prisma.js";

interface ProductInput {
    title: string;
    description: string;
    price: number;
    imageUrl: string;
    ownerId: string;
    categoryId: string;
}

export const productService = {
    async create(data: ProductInput) {
        await prisma.product.create({
            data: data
        })
    }
}