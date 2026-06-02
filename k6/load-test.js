/**
 * ASUR k6 Load Test — S17-T6
 *
 * Simulates 50 concurrent users across three flows:
 *   - browse:   list products, view a single PDP
 *   - cart:     browse + add to cart, view cart
 *   - checkout: browse + cart + initiate checkout (payment order creation)
 *
 * Run with:
 *   k6 run --env BASE_URL=http://localhost:4000 k6/load-test.js
 *
 * Pass a real Firebase ID token for authenticated flows:
 *   k6 run --env BASE_URL=http://localhost:4000 --env AUTH_TOKEN=<token> k6/load-test.js
 */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";

// Custom metrics
const errorRate = new Rate("errors");
const productListLatency = new Trend("product_list_latency", true);
const addToCartLatency = new Trend("add_to_cart_latency", true);
const checkoutLatency = new Trend("checkout_latency", true);

export const options = {
  scenarios: {
    browse_users: {
      executor: "constant-vus",
      vus: 20,
      duration: "2m",
      exec: "browse"
    },
    cart_users: {
      executor: "constant-vus",
      vus: 20,
      duration: "2m",
      exec: "addToCart"
    },
    checkout_users: {
      executor: "constant-vus",
      vus: 10,
      duration: "2m",
      exec: "checkout"
    }
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.05"],
    errors: ["rate<0.05"]
  }
};

const authHeaders = AUTH_TOKEN
  ? { Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" }
  : { "Content-Type": "application/json" };

function checkOk(res, label) {
  const ok = check(res, {
    [`${label} status 2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`${label} has body`]: (r) => r.body && r.body.length > 0
  });
  errorRate.add(!ok);
  return ok;
}

// ─── Scenario: browse ────────────────────────────────────────────────────────
export function browse() {
  group("health check", () => {
    const res = http.get(`${BASE_URL}/health`);
    checkOk(res, "health");
  });

  sleep(1);

  group("list products", () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/v1/products?limit=20`);
    productListLatency.add(Date.now() - start);
    checkOk(res, "product list");

    if (res.status === 200) {
      const body = JSON.parse(res.body);
      const products = body?.data?.products ?? [];
      if (products.length > 0) {
        const slug = products[Math.floor(Math.random() * products.length)].slug;
        sleep(0.5);

        group("product detail", () => {
          const pdp = http.get(`${BASE_URL}/api/v1/products/${slug}`);
          checkOk(pdp, "product detail");
        });
      }
    }
  });

  sleep(Math.random() * 2 + 1);
}

// ─── Scenario: add to cart (uses local cart — no auth needed) ────────────────
export function addToCart() {
  browse();

  group("add to cart", () => {
    const listRes = http.get(`${BASE_URL}/api/v1/products?limit=10`);
    if (listRes.status !== 200) return;

    const products = JSON.parse(listRes.body)?.data?.products ?? [];
    if (products.length === 0) return;

    const product = products[Math.floor(Math.random() * products.length)];
    const variant = product.variants?.[0];
    if (!variant) return;

    const start = Date.now();
    // Cart is client-side (Zustand) — simulate a product read as a proxy
    const res = http.get(`${BASE_URL}/api/v1/products/${product.slug}`);
    addToCartLatency.add(Date.now() - start);
    checkOk(res, "cart product fetch");
  });

  sleep(Math.random() * 2 + 1);
}

// ─── Scenario: checkout (requires AUTH_TOKEN) ────────────────────────────────
export function checkout() {
  if (!AUTH_TOKEN) {
    browse();
    return;
  }

  addToCart();

  group("create order", () => {
    const listRes = http.get(`${BASE_URL}/api/v1/products?limit=10`);
    if (listRes.status !== 200) return;

    const products = JSON.parse(listRes.body)?.data?.products ?? [];
    const product = products.find((p) => p.variants?.some((v) => v.stock > 0));
    if (!product) return;

    const variant = product.variants.find((v) => v.stock > 0);

    const payload = JSON.stringify({
      items: [{ productId: product._id, variantSku: variant.sku, quantity: 1 }],
      address: {
        fullName: "Test User",
        line1: "123 Load Test Lane",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        phone: "9999999999"
      }
    });

    const start = Date.now();
    const res = http.post(`${BASE_URL}/api/v1/orders`, payload, { headers: authHeaders });
    checkoutLatency.add(Date.now() - start);
    checkOk(res, "create order");
  });

  sleep(Math.random() * 3 + 2);
}
