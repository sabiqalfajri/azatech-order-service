import fp from "fastify-plugin"
import type { FastifyPluginAsync } from "fastify"
import fastifyJwt from "@fastify/jwt"

export type JwtPayload = {
  sub: string
};

export const jwtPlugin: FastifyPluginAsync = fp(async (app) => {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("JWT secrets are missing")

  await app.register(fastifyJwt, {
    secret,
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
    },
  })
})