import type { FastifyReply, FastifyRequest } from "fastify";
import { productService } from "../services/product-service.js";
import { CartService } from "../services/cart-service.js";

export async function addProductToCart(
    req: FastifyRequest<{ Body: { productId: string } }>,
    reply: FastifyReply
) {
    if (req.user.role !== "CUSTOMER") {
        return reply.status(403).send({ message: "Acesso negado: apenas clientes podem adicionar produtos ao carrinho." });
    }

    const { productId } = req.body;

    if (!productId) {
        return reply.status(400).send({ message: "ID do produto não informado." });
    }

    const product = await productService.getById(productId);

    if (!product) {
        return reply.status(404).send({ message: "Produto não encontrado." });
    }

    const quantity = 1;

    if (product.stock < quantity) {
        return reply.status(400).send({ message: "Estoque insuficiente para adicionar ao carrinho." });
    }

    try {
        const cart = await CartService.getByUser(req.user.id);

        if (!cart) {
            return reply.status(404).send({ message: "Carrinho não encontrado para o usuário atual." });
        }

        await CartService.addProduct(cart.id, productId, quantity);

        return reply.status(201).send({ message: "Produto adicionado ao carrinho com sucesso." });
    } catch (err) {
        console.error("Erro ao adicionar produto ao carrinho:", err);
        return reply.status(500).send({ message: "Erro interno ao adicionar produto ao carrinho." });
    }
}