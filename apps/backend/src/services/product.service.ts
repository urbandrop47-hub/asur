import { productRepository, type ProductSearchParams } from "../repositories/product.repository";

export async function listProducts() {
  return productRepository.list();
}

export async function searchProducts(params: ProductSearchParams) {
  return productRepository.search(params);
}

export async function suggestProducts(q: string, limit = 6) {
  return productRepository.suggest(q, limit);
}

export async function getProductBySlug(slug: string) {
  return productRepository.findBySlug(slug);
}

export async function getRelatedProducts(slug: string, limit = 4) {
  return productRepository.related(slug, limit);
}
