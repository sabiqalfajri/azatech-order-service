import type { FastifyReply, FastifyRequest } from "fastify";
import type { LoginInput } from "./schema.js";
import { successResponse } from "../../lib/response.js";
import type { AuthService } from "./service.js";

type AuthControllerDeps = {
  authService: AuthService;
};

export function createAuthController(deps: AuthControllerDeps) {
  return {
    login: async (
      request: FastifyRequest<{ Body: LoginInput }>,
      reply: FastifyReply,
    ) => {
      const result = await deps.authService.login(request.body);

      return reply.code(200).send(
        successResponse(result, "Login berhasil"),
      );
    },
  };
}
