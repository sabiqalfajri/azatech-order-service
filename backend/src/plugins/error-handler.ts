import type {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import fp from "fastify-plugin";
import { AppError } from "../common/errors/app-error.js";
import { errorResponse } from "../lib/response.js";
import { handleFastifyContentTypeParserError, handleFastifyValidationError } from "../common/errors/handlers/fastify-error.js";
import { handleZodError } from "../common/errors/handlers/zod-error.js";
import { handleDrizzleError } from "../common/errors/handlers/drizzle-error.js";
import { handleJwtError } from "../common/errors/handlers/jwt-error.js";

function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const handled =
    error instanceof AppError
      ? error
      : handleFastifyValidationError(error as FastifyError) ??
        handleFastifyContentTypeParserError(error as FastifyError) ??
        handleZodError(error) ??
        handleJwtError(error) ??
        handleDrizzleError(error);

  if (handled) {
    const log = handled.statusCode >= 500 ? request.log.error : request.log.warn;
    log.call(request.log, { err: error }, "Request error");

    return reply
      .code(handled.statusCode)
      .send(errorResponse(handled.message, handled.errors));
  }

  const status = (error as FastifyError).statusCode;
  if (status && status >= 400 && status < 500) {
    request.log.warn({ err: error }, "Client error");
    return reply.code(status).send(errorResponse(error.message));
  }

  request.log.error({ err: error }, "Unhandled error");
  return reply.code(500).send(errorResponse("Internal server error"));
}

export const errorHandlerPlugin = fp(async function (app: FastifyInstance) {
  app.setErrorHandler(errorHandler);

  app.setNotFoundHandler((_req, reply) => {
    reply.code(404).send(errorResponse("Route tidak ditemukan"));
  });
});