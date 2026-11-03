
import type { FastifyReply, FastifyRequest } from "fastify";
import type { OrderService } from "./service.js";
import type {
  CreateOrderInput,
  GetOrdersQuery,
  OrderIdParams
} from "./schema.js";

type OrderControllerDeps = {
  orderService: OrderService;
};

export function createOrderController(deps: OrderControllerDeps) {
  return {
    getOrders: async (
      request: FastifyRequest<{ Querystring: GetOrdersQuery }>,
      reply: FastifyReply,
    ) => {
      const result = await deps.orderService.getOrders(request.query);

      return reply.code(200).send({
        success: true,
        message: "Berhasil mengambil data order",
        data: result.items,
        meta: result.meta,
      });
    },

    getOrderById: async (
      request: FastifyRequest<{ Params: OrderIdParams }>,
      reply: FastifyReply,
    ) => {
      const result = await deps.orderService.getOrderById(
        request.params.id,
      );

      return reply.code(200).send({
        success: true,
        message: "Berhasil mengambil detail order",
        data: result,
      });
    },

    createOrder: async (
      request: FastifyRequest<{ Body: CreateOrderInput }>,
      reply: FastifyReply,
    ) => {
      const result = await deps.orderService.createOrder(
        request.body,
        request.access!.sub,
      );

      return reply.code(201).send({
        success: true,
        message: "Order berhasil dibuat",
        data: result,
      });
    },

    payOrder: async (
      request: FastifyRequest<{ Params: OrderIdParams }>,
      reply: FastifyReply,
    ) => {
      const result = await deps.orderService.payOrder(
        request.params.id,
      );

      return reply.code(200).send({
        success: true,
        message: "Order berhasil dibayar",
        data: result,
      });
    },

    cancelOrder: async (
      request: FastifyRequest<{ Params: OrderIdParams }>,
      reply: FastifyReply,
    ) => {
      const result = await deps.orderService.cancelOrder(
        request.params.id,
      );

      return reply.code(200).send({
        success: true,
        message: "Order berhasil dibatalkan",
        data: result,
      });
    },
  };
}