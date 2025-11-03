import { prisma } from "../lib/prisma.js"

export const CartService = {
    async getByUser(userId: string) {
        return await prisma.cart.findUnique({
            where: {
                userId
            }
        })
    },

    async addProduct(cartId: string, productId: string, quantity = 1) {
        await prisma.$transaction(async (tx) => {
            await tx.cartItem.upsert({
                where: {
                    cartId_productId: { cartId, productId },
                },
                update: {
                    quantity: { increment: quantity },
                },
                create: {
                    cartId,
                    productId,
                    quantity,
                },
            });

            await tx.product.update({
                where: { id: productId },
                data: {
                    stock: { decrement: quantity },
                },
            });
        })
    }
}