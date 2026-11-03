import type { FastifyReply, FastifyRequest } from "fastify";
import type { CustomerService } from "./service.js";
import type {
  CreateCustomerInput,
  GetCustomersQuery,
} from "./schema.js";

type CustomerControllerDeps = {
  customerService: CustomerService;
};

export function createCustomerController({
  customerService,
}: CustomerControllerDeps) {
  return {
    async getCustomers(
      request: FastifyRequest<{ Querystring: GetCustomersQuery }>,
      reply: FastifyReply
    ) {
      const result = await customerService.getCustomers(request.query);

      return reply.code(200).send({
        success: true,
        message: "Daftar pelanggan berhasil diambil",
        data: result.items,
        meta: result.meta,
      });
    },

    async createCustomer(
      request: FastifyRequest<{ Body: CreateCustomerInput }>,
      reply: FastifyReply
    ) {
      const customer = await customerService.createCustomer(request.body);

      return reply.code(201).send({
        success: true,
        message: "Pelanggan berhasil dibuat",
        data: customer,
      });
    },
  };
}