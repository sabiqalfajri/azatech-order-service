import type { ProductService } from "./services.js";

type ProductControllerDeps = {
  productService: ProductService;
};

export function createAuthController(deps: ProductControllerDeps) {

}