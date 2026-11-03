import { env } from './config/env.js';
import fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { validatorCompiler, serializerCompiler } from "fastify-type-provider-zod";
import { registerRoutes } from './routes/index.js';
import { registerPlugins } from './plugins/index.js';

export const buildApp = () => {
  const app = fastify({
    logger: true,
    trustProxy: env.NODE_ENV === "production"
  })

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(helmet, {
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })

  const frontendUrl = env.FRONTEND_URL;
  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is missing in environment variables")
  }

  app.register(cors, {
    origin: [...new Set(["http://localhost:3000", env.FRONTEND_URL])],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  });

  app.register(registerPlugins)
  app.register(registerRoutes)

  app.get('/', async () => {
    return { message: 'Hello from Fastify + Typescript + Drizzle' };
  });

  return app;
}