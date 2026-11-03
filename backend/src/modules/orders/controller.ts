import type { OrderService } from "./service.js";

type OrderControllerDeps = {
  orderService: OrderService;
};

export function createOrderController(deps: OrderControllerDeps) {

}