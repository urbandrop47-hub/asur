import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ASUR Commerce API",
      version: "1.0.0",
      description:
        "REST API for the ASUR fashion commerce platform. Covers auth, products, cart, orders, and payments. " +
        "Protected endpoints require a Firebase ID token as a Bearer token in the Authorization header."
    },
    servers: [
      { url: "http://localhost:4000", description: "Local development" },
      { url: "https://api.asur.store", description: "Production" }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "Firebase ID Token",
          description: "Obtain a Firebase ID token via the web app sign-in and paste it here."
        }
      },
      schemas: {
        Address: {
          type: "object",
          required: ["fullName", "phone", "line1", "city", "state", "postalCode", "country"],
          properties: {
            fullName: { type: "string", example: "Rahul Sharma" },
            phone: { type: "string", example: "+91 98765 43210" },
            line1: { type: "string", example: "42 MG Road" },
            line2: { type: "string", example: "Apt 3B" },
            city: { type: "string", example: "Bengaluru" },
            state: { type: "string", example: "Karnataka" },
            postalCode: { type: "string", example: "560001" },
            country: { type: "string", example: "India" },
            label: { type: "string", example: "Home" },
            isDefault: { type: "boolean" }
          }
        },
        ProductVariant: {
          type: "object",
          properties: {
            size: { type: "string", example: "M" },
            color: { type: "string", example: "Obsidian" },
            sku: { type: "string", example: "EMB-M-OBS" },
            stock: { type: "integer", example: 42 },
            price: { type: "integer", description: "Price in paise (INR × 100)", example: 8900 },
            compareAtPrice: { type: "integer", example: 9900 }
          }
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            media: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  url: { type: "string" },
                  alt: { type: "string" }
                }
              }
            },
            variants: { type: "array", items: { $ref: "#/components/schemas/ProductVariant" } },
            collectionSlugs: { type: "array", items: { type: "string" } },
            status: { type: "string", enum: ["draft", "active", "archived"] }
          }
        },
        CartItem: {
          type: "object",
          required: ["productId", "variantSku", "quantity", "unitPrice"],
          properties: {
            productId: { type: "string" },
            variantSku: { type: "string" },
            quantity: { type: "integer", minimum: 1 },
            unitPrice: { type: "integer" }
          }
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "string" },
            orderNumber: { type: "string", example: "ASUR-LK3F2J" },
            customerId: { type: "string" },
            items: { type: "array", items: { $ref: "#/components/schemas/CartItem" } },
            subtotal: { type: "integer" },
            shipping: { type: "integer" },
            tax: { type: "integer" },
            total: { type: "integer" },
            currency: { type: "string", example: "INR" },
            status: { type: "string", enum: ["draft", "pending_payment", "paid", "processing", "packed", "shipped", "delivered", "cancelled"] },
            paymentStatus: { type: "string", enum: ["pending", "authorized", "captured", "failed", "refunded"] },
            fulfillmentStatus: { type: "string" },
            shippingAddress: { $ref: "#/components/schemas/Address" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" }
          }
        },
        ApiSuccess: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {},
            message: { type: "string" }
          }
        },
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" }
          }
        }
      }
    },
    security: [{ BearerAuth: [] }]
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"]
};

export const swaggerSpec = swaggerJsdoc(options);
