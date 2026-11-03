import type { FastifyInstance } from "fastify";
import type {
  JwtPayload,
  TokenSigner,
  TokenVerifier,
} from "./token.types.js";
import { UnauthorizedError } from "../../common/errors/sub-error.js";
import { isJwtExpired, isJwtInvalid } from "../../common/errors/handlers/jwt-error.js";

type Jwt = FastifyInstance["jwt"];

export function createTokenService(jwt: Jwt): TokenSigner & TokenVerifier {
  return {
    sign(payload) {
      return jwt.sign(payload);
    },

    verify(token) {
      try {
        return jwt.verify<JwtPayload>(token);
      } catch (error) {
        if (isJwtExpired(error)) {
          throw new UnauthorizedError("Access token kedaluwarsa");
        }

        if (isJwtInvalid(error)) {
          throw new UnauthorizedError("Access token tidak valid");
        }

        throw error;
      }
    },
  };
}