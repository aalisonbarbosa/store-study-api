import bcrypt from "bcrypt";
import type { FastifyReply, FastifyRequest } from "fastify";
import { loginSchema, registerSchema } from "../schemas/auth-schema.js";
import { userService } from "../services/user-service.js";

export const authController = {
  async register(req: FastifyRequest, reply: FastifyReply) {
    const parseResult = registerSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((err) => err.message);
      return reply.status(400).send({ message: "Dados inválidos", errors });
    }

    const { name, email, password, role } = parseResult.data;

    try {
      const existingUser = await userService.findUserByEmail(email);
      if (existingUser) {
        return reply.status(409).send({
          message: "Já existe uma conta registrada com este e-mail",
        });
      }

      const hashPassword = await bcrypt.hash(password, 10);

      await userService.create({ name, email, password: hashPassword, role });

      reply.status(201).send({ message: "Usuário criado com sucesso" });
    } catch (err) {
      console.error("Erro ao registrar usuário:", err);
      reply.status(500).send({
        message: "Erro interno no servidor",
      });
    }
  },

  async login(req: FastifyRequest, reply: FastifyReply) {
    const parseResult = loginSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((err) => err.message);
      return reply.status(400).send({ message: "Dados inválidos", errors });
    }

    const { email, password } = parseResult.data;

    try {
      const user = await userService.findUserByEmail(email);

      if (!user) {
        return reply.status(401).send({ message: "Credenciais inválidas" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return reply.status(401).send({ message: "Credenciais inválidas" });
      }

      const token = req.server.jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          createAt: user.createdAt,
        },
        { expiresIn: "3d" }
      );

      return reply.send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          createAt: user.createdAt,
        },
        token,
      });
    } catch (err) {
      console.error("Erro no login:", err);
      reply.status(500).send({ message: "Erro interno no servidor" });
    }
  },
};
