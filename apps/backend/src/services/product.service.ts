import { productRepository } from "../repositories/product.repository";

export async function listProducts() {
  return productRepository.list();
}

export async function getProductBySlug(slug: string) {
  return productRepository.findBySlug(slug);
}
