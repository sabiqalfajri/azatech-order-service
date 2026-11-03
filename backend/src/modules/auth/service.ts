import { eq } from "drizzle-orm";
import { UnauthorizedError } from "../../common/errors/sub-error.js";
import { users } from "../../db/schema/users.js";
import type { DB } from "../../db/types.js";
import type { TokenSigner } from "./token.types.js";
import type { LoginInput } from "./schema.js";
import { verifyPassword } from "../../lib/crypto.js";

type AuthServiceDeps = {
  db: DB
  tokenSigner: TokenSigner
}

export function createAuthService(deps: AuthServiceDeps) {
  return {
    async login(input: LoginInput) {
      const [user] = await deps.db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1)

      if (!user) {
        throw new UnauthorizedError("Email atau password salah")
      }

      const isPasswordValid = await verifyPassword(
        input.password,
        user.passwordHash,
      )

      if (!isPasswordValid) {
        throw new UnauthorizedError("Email atau password salah")
      }

      const accessToken = deps.tokenSigner.sign({
        sub: user.id,
      })

      return {
        access_token: accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      }
    },
  }
}

export type AuthService = ReturnType<typeof createAuthService>