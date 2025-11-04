import { prisma } from "../lib/prisma.js"

interface OrderItemInput {
    productId: string;
    quantity: number;
    unitPrice: number;
}

interface OrderInput {
    userId: string;
    total: number;
    items: OrderItemInput[];
}

export const orderService = {
    async createOrder({ userId, total, items }: OrderInput) {
        return await prisma.order.create({
            data: {
                total,
                userId,
                OrderItem: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                    })),
                },
            }
        })
    },

    async createPayment(total: number, orderId: string) {
        return await prisma.payment.create({
            data: {
                amount: total,
                status: "INITIATED",
                orderId,
            }
        })
    },

    async getOrderWithPayment(orderId: string) {
        return await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                Payment: true,
                OrderItem: { include: { Product: true } },
            },
        });
    },

    async confirmPayment(orderId: string) {
        return await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: {
                    Payment: true,
                    OrderItem: {
                        include: {
                            Product: true,
                        },
                    },
                },
            });

            if (!order) throw new Error("Order não encontrada.");
            if (!order.Payment) throw new Error("Payment não encontrada para esta order.");
            if (order.Payment.status !== "INITIATED") throw new Error("Pagamento já processado ou em estado inválido.");

            await tx.payment.update({
                where: { id: order.Payment.id },
                data: { status: "CONFIRMED" },
            });

            for (const item of order.OrderItem) {
                const product = item.Product;
                if (!product) throw new Error(`Produto ${item.productId} não encontrado.`);
                if (product.stock < item.quantity) {
                    throw new Error(`Estoque insuficiente para o produto ${product.title || product.id}.`);
                }

                await tx.product.update({
                    where: { id: product.id },
                    data: { stock: { decrement: item.quantity } },
                });
            }

            const ADMIN_FEE_RATE = 0.1;

            const sellerTotals = new Map<string, number>();
            let adminTotal = 0;

            for (const item of order.OrderItem) {
                const itemGross = item.unitPrice * item.quantity;
                const adminFee = itemGross * ADMIN_FEE_RATE;
                const sellerShare = itemGross - adminFee;

                adminTotal += adminFee;

                const sellerId = item.Product.ownerId;
                const previous = sellerTotals.get(sellerId) ?? 0;
                sellerTotals.set(sellerId, previous + sellerShare);
            }

            const adminUser = await tx.user.findFirst({ where: { role: "ADMIN" } });
            if (!adminUser) throw new Error("Nenhum admin encontrado para receber taxa.");

            const adminWallet = await tx.wallet.upsert({
                where: { userId: adminUser.id },
                update: {},
                create: { userId: adminUser.id, balance: 0 },
            });

            if (adminTotal > 0) {
                await tx.transaction.create({
                    data: {
                        walletId: adminWallet.id,
                        type: "CREDIT",
                        amount: adminTotal,
                        description: `Taxa administrativa sobre order ${orderId}`,
                    },
                });

                await tx.wallet.update({
                    where: { id: adminWallet.id },
                    data: { balance: { increment: adminTotal } },
                });
            }

            for (const [sellerId, amount] of sellerTotals.entries()) {
                const sellerWallet = await tx.wallet.upsert({
                    where: { userId: sellerId },
                    update: {},
                    create: { userId: sellerId, balance: 0 },
                });

                await tx.transaction.create({
                    data: {
                        walletId: sellerWallet.id,
                        type: "CREDIT",
                        amount,
                        description: `Pagamento por vendas da order ${orderId}`,
                    },
                });

                await tx.wallet.update({
                    where: { id: sellerWallet.id },
                    data: { balance: { increment: amount } },
                });
            }

            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status: "PAID" },
                include: { OrderItem: true, Payment: true },
            });

            const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
            if (cart) {
                await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
            }

            return updatedOrder;
        }, { maxWait: 5000, timeout: 15000 });
    },
}