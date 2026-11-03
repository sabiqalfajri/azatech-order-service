import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { createTokenService } from "../modules/auth/token.service.js";
import { UnauthorizedError } from "../common/errors/sub-error.js";

export const authenticatePlugin: FastifyPluginAsync = fp(async (app) => {
  const tokenService = createTokenService(app.jwt);

  app.decorate("authenticate", async (request: FastifyRequest) => {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Token tidak ditemukan");
    }

    const token = authHeader.slice("Bearer ".length).trim();

    if (!token) {
      throw new UnauthorizedError("Token tidak ditemukan");
    }

    request.access = tokenService.verify(token);
  });
});