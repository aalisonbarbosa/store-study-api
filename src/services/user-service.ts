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

    async create(data: UserInput) {
        await prisma.user.create({
            data,
        })
    }
}