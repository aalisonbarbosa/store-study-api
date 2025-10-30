import { prisma } from "../lib/prisma.js";

interface UserInput {
    name: string;
    email: string;
    password: string;
    role: "ADMIN" | "SELLER" | "CUSTOMER"
}

export const userService = {
    async findUserByEmail(email: string) {
        return await prisma.user.findUnique({
            where: {
                email,
            }
        })
    },

    async createUser(data: UserInput) {
        const { role, ...rest } = data;

        await prisma.user.create({
            data: {
                ...rest,
                role,
                ...(role === "SELLER" || role === "ADMIN" ? {
                    Wallet: {
                        create: {},
                    },
                } : {}),
            },
        });
    }
}