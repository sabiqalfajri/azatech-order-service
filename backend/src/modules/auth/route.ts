import type { FastifyPluginAsync } from "fastify";
import { createTokenService } from "./token.service.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { withDefaultResponses } from "../../common/schemas/response.js";
import { createAuthService } from "./service.js";
import { createAuthController } from "./controller.js";
import { loginResponseSchema, loginSchema } from "./schema.js";

export const authRoutes: FastifyPluginAsync = async (app) => {
  const route = app.withTypeProvider<ZodTypeProvider>();
  
  const tokenService = createTokenService(app.jwt);
  const authService = createAuthService({
    db: app.db,
    tokenSigner: tokenService,
  });

  const controller = createAuthController({ authService });

  route.post("/login", 
    {
      schema: {
        body: loginSchema,
        response: withDefaultResponses({
          200: loginResponseSchema
        })
      }
    },
    controller.login
  )
}