import type { FastifyReply, FastifyRequest } from "fastify";
import { productService } from "../services/product-service.js";
import { cartService } from "../services/cart-service.js";

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

    try {
        const cart = await cartService.getByUser(req.user.id);

        if (!cart) {
            return reply.status(404).send({ message: "Carrinho não encontrado para o usuário atual." });
        }

        await cartService.addProduct(cart.id, productId);

        return reply.status(201).send({ message: "Produto adicionado ao carrinho com sucesso." });
    } catch (err) {
        console.error("Erro ao adicionar produto ao carrinho:", err);
        return reply.status(500).send({ message: "Erro interno ao adicionar produto ao carrinho." });
    }
}

export async function decrementProductInCart(
    req: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply
) {
    if (req.user.role !== "CUSTOMER") {
        return reply.status(403).send({ message: "Acesso negado: apenas clientes podem modificar o carrinho." });
    }

    const { productId } = req.params;
    if (!productId) {
        return reply.status(400).send({ message: "ID do produto não informado." });
    }

    try {
        const cart = await cartService.getByUser(req.user.id);
        if (!cart) {
            return reply.status(404).send({ message: "Carrinho não encontrado para o usuário atual." });
        }

        const cartItem = await cartService.getCartItem(cart.id, productId);
        if (!cartItem) {
            return reply.status(404).send({ message: "Produto não encontrado no carrinho." });
        }

        await cartService.decrementProduct(cart.id, productId);

        return reply.status(200).send({ message: "Quantidade do produto no carrinho decrementada com sucesso." });
    } catch (err) {
        console.error("Erro ao decrementar produto no carrinho:", err);
        return reply.status(500).send({ message: "Erro interno ao atualizar o carrinho." });
    }
}

export async function removeProductFromCart(
    req: FastifyRequest<{ Params: { productId: string } }>,
    reply: FastifyReply
) {
    if (req.user.role !== "CUSTOMER") {
        return reply.status(403).send({ message: "Acesso negado: apenas clientes podem modificar o carrinho." });
    }

    const { productId } = req.params;
    if (!productId) {
        return reply.status(400).send({ message: "ID do produto não informado." });
    }

    try {
        const cart = await cartService.getByUser(req.user.id);
        if (!cart) {
            return reply.status(404).send({ message: "Carrinho não encontrado para o usuário atual." });
        }

        const cartItem = await cartService.getCartItem(cart.id, productId);
        if (!cartItem) {
            return reply.status(404).send({ message: "Produto não encontrado no carrinho." });
        }

        await cartService.deleteCartItem(cartItem.id);

        return reply.status(200).send({ message: "Produto removido do carrinho com sucesso." });
    } catch (err) {
        console.error("Erro ao remover produto do carrinho:", err);
        return reply.status(500).send({ message: "Erro interno ao atualizar o carrinho." });
    }
}