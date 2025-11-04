import type { FastifyReply, FastifyRequest } from "fastify";
import { cartService } from "../services/cart-service.js";
import { orderService } from "../services/order-service.js";

export async function confirmOrder(req: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = req.user.id;

        const cart = await cartService.getByUser(userId);
        if (!cart || !cart.CartItem.length) {
            return reply.status(404).send({ message: "Carrinho vazio ou não encontrado." });
        }

        const total = cart.CartItem.reduce((sum, i) => sum + i.Product.price * i.quantity, 0);

        const items = cart.CartItem.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.Product.price,
        }));

        const order = await orderService.createOrder({ userId, total, items });
        if (!order) {
            return reply.status(500).send({ message: "Erro ao criar o pedido." });
        }

        const payment = await orderService.createPayment(total, order.id);
        if (!payment) {
            return reply.status(500).send({ message: "Erro ao processar pagamento." });
        }

        return reply.status(201).send({
            message: "Pedido criado e pagamento iniciado com sucesso.",
            orderId: order.id,
        });
    } catch (err) {
        console.error("Erro ao confirmar pedido:", err);
        return reply.status(500).send({
            message: "Erro interno no servidor",
        });
    }
}

export async function confirmPayment(req: FastifyRequest<{ Params: { orderId: string } }>, reply: FastifyReply) {
    try {
        const { orderId } = req.params;
        if (!orderId) return reply.status(400).send({ message: "orderId não informado." });

        const updatedOrder = await orderService.confirmPayment(orderId);

        return reply.status(200).send({ message: "Pagamento confirmado e pagamentos distribuídos.", order: updatedOrder });
    } catch (err: any) {
        console.error("Erro ao confirmar pagamento:", err);
        return reply.status(500).send({ message: "Erro interno no servidor" });
    }
}