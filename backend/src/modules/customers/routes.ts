import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  withDefaultResponses,
  withPaginatedResponse,
} from "../../common/schemas/response.js";
import { createCustomerController } from "./controller.js";
import { createCustomerService } from "./service.js";
import {
  createCustomerSchema,
  customerSchema,
  getCustomersQuerySchema,
} from "./schema.js";

export const customerRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", app.authenticate);

  const route = app.withTypeProvider<ZodTypeProvider>();

  const customerService = createCustomerService({
    db: app.db,
  });
  const controller = createCustomerController({
    customerService,
  });

  route.get(
    "/",
    {
      schema: {
        tags: ["Customers"],
        summary: "Get customers",
        querystring: getCustomersQuerySchema,
        response: withPaginatedResponse(customerSchema),
      },
    },
    controller.getCustomers
  );

  route.post(
    "/",
    {
      schema: {
        tags: ["Customers"],
        summary: "Create customer",
        body: createCustomerSchema,
        response: withDefaultResponses({
          201: customerSchema,
        }),
      },
    },
    controller.createCustomer
  );
};