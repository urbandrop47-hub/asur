import { productRepository, type ProductSearchParams } from "../repositories/product.repository";

export async function listProducts() {
  return productRepository.list();
}

export async function searchProducts(params: ProductSearchParams) {
  return productRepository.search(params);
}

export async function getProductBySlug(slug: string) {
  return productRepository.findBySlug(slug);
}
