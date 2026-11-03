import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  withDefaultResponses,
  withPaginatedResponse,
} from "../../common/schemas/response.js";
import { createOrderController } from "./controller.js";
import { createOrderService } from "./service.js";
import {
  createOrderSchema,
  getOrdersQuerySchema,
  orderIdParamSchema,
  orderSchema,
} from "./schema.js";

export const orderRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", app.authenticate);

  const route = app.withTypeProvider<ZodTypeProvider>();

  const orderService = createOrderService({
    db: app.db,
  })
  const controller = createOrderController({
    orderService,
  })

  route.get("/", {
    schema: {
      tags: ["Orders"],
      summary: "Get orders",
      querystring: getOrdersQuerySchema,
      response: withPaginatedResponse(orderSchema),
    },
  }, controller.getOrders)

  route.get("/:id", {
    schema: {
      tags: ["Orders"],
      summary: "Get order detail",
      params: orderIdParamSchema,
      response: withDefaultResponses({ 200: orderSchema }),
    },
  }, controller.getOrderById)

  route.post("/", {
    schema: {
      tags: ["Orders"],
      summary: "Create order",
      body: createOrderSchema,
      response: withDefaultResponses({ 201: orderSchema }),
    },
  }, controller.createOrder)

  route.patch("/:id/pay", {
    schema: {
      tags: ["Orders"],
      summary: "Pay order",
      params: orderIdParamSchema,
      response: withDefaultResponses({ 200: orderSchema }),
    },
  }, controller.payOrder)

  route.patch("/:id/cancel", {
    schema: {
      tags: ["Orders"],
      summary: "Cancel order",
      params: orderIdParamSchema,
      response: withDefaultResponses({ 200: orderSchema }),
    },
  }, controller.cancelOrder)
};