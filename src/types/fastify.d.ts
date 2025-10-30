import "fastify";

declare module "fastify" {
    interface FastifyInstance {
        authenticate: any;
    }
}

declare module "@fastify/jwt" {
    interface FastifyJWT {
        user: {
            id: string;
            role: "CUSTOMER" | "SELLER" | "ADMIN";
            email: string;
            name: string;
        };
    }
}