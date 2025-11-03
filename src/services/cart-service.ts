import { prisma } from "../lib/prisma.js"

export const CartService = {
    async getByUser(userId: string) {
        return await prisma.cart.findUnique({
            where: {
                userId
            }
        })
    },

    async getCartItem(cartId: string, productId: string) {
        return await prisma.cartItem.findUnique({
            where: {
                cartId_productId: { cartId, productId },
            }
        });
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
    },

    async decrementProduct(cartId: string, productId: string) {
        await prisma.$transaction(async (tx) => {
            const cartItem = await this.getCartItem(cartId, productId);

            if (!cartItem) throw new Error("Produto não encontrado no carrinho");

            if (cartItem.quantity === 1) {
                await this.deleteCartItem(cartItem.id);
            } else {
                await tx.cartItem.update({
                    where: {
                        cartId_productId: { cartId, productId },
                    },
                    data: {
                        quantity: { decrement: 1 }
                    }
                });
            }

            await tx.product.update(
                {
                    where: { id: productId },
                    data: {
                        stock: { increment: 1 }
                    }
                });
        })
    },

    async deleteCartItem(id: string) {
        await prisma.cartItem.delete({ where: { id } });
    }
}