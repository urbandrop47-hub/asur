import { z } from "zod";
export declare const roles: readonly ["CUSTOMER", "ADMIN", "VENDOR", "SUPER_ADMIN"];
export declare const productStatuses: readonly ["draft", "active", "archived"];
export declare const orderStatuses: readonly ["draft", "pending_payment", "paid", "processing", "packed", "shipped", "delivered", "cancelled"];
export declare const fulfillmentStatuses: readonly ["unassigned", "assigned", "in_progress", "ready_to_ship", "shipped", "delivered"];
export declare const paymentStatuses: readonly ["pending", "authorized", "captured", "failed", "refunded"];
export declare const roleSchema: z.ZodEnum<["CUSTOMER", "ADMIN", "VENDOR", "SUPER_ADMIN"]>;
export declare const productStatusSchema: z.ZodEnum<["draft", "active", "archived"]>;
export declare const orderStatusSchema: z.ZodEnum<["draft", "pending_payment", "paid", "processing", "packed", "shipped", "delivered", "cancelled"]>;
export declare const fulfillmentStatusSchema: z.ZodEnum<["unassigned", "assigned", "in_progress", "ready_to_ship", "shipped", "delivered"]>;
export declare const paymentStatusSchema: z.ZodEnum<["pending", "authorized", "captured", "failed", "refunded"]>;
export declare const mediaAssetSchema: z.ZodObject<{
    url: z.ZodString;
    alt: z.ZodOptional<z.ZodString>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    url: string;
    alt?: string | undefined;
    width?: number | undefined;
    height?: number | undefined;
}, {
    url: string;
    alt?: string | undefined;
    width?: number | undefined;
    height?: number | undefined;
}>;
export declare const productVariantSchema: z.ZodObject<{
    size: z.ZodString;
    color: z.ZodString;
    sku: z.ZodString;
    stock: z.ZodNumber;
    price: z.ZodNumber;
    compareAtPrice: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    size: string;
    color: string;
    sku: string;
    stock: number;
    price: number;
    compareAtPrice?: number | undefined;
}, {
    size: string;
    color: string;
    sku: string;
    stock: number;
    price: number;
    compareAtPrice?: number | undefined;
}>;
export declare const productSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    slug: z.ZodString;
    description: z.ZodString;
    category: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    media: z.ZodDefault<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        alt: z.ZodOptional<z.ZodString>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        alt?: string | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }, {
        url: string;
        alt?: string | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }>, "many">>;
    variants: z.ZodArray<z.ZodObject<{
        size: z.ZodString;
        color: z.ZodString;
        sku: z.ZodString;
        stock: z.ZodNumber;
        price: z.ZodNumber;
        compareAtPrice: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        size: string;
        color: string;
        sku: string;
        stock: number;
        price: number;
        compareAtPrice?: number | undefined;
    }, {
        size: string;
        color: string;
        sku: string;
        stock: number;
        price: number;
        compareAtPrice?: number | undefined;
    }>, "many">;
    seo: z.ZodOptional<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        canonical: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description?: string | undefined;
        title?: string | undefined;
        keywords?: string[] | undefined;
        canonical?: string | undefined;
    }, {
        description?: string | undefined;
        title?: string | undefined;
        keywords?: string[] | undefined;
        canonical?: string | undefined;
    }>>;
    status: z.ZodEnum<["draft", "active", "archived"]>;
}, "strip", z.ZodTypeAny, {
    status: "draft" | "active" | "archived";
    id: string;
    description: string;
    title: string;
    slug: string;
    category: string;
    tags: string[];
    media: {
        url: string;
        alt?: string | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }[];
    variants: {
        size: string;
        color: string;
        sku: string;
        stock: number;
        price: number;
        compareAtPrice?: number | undefined;
    }[];
    seo?: {
        description?: string | undefined;
        title?: string | undefined;
        keywords?: string[] | undefined;
        canonical?: string | undefined;
    } | undefined;
}, {
    status: "draft" | "active" | "archived";
    id: string;
    description: string;
    title: string;
    slug: string;
    category: string;
    variants: {
        size: string;
        color: string;
        sku: string;
        stock: number;
        price: number;
        compareAtPrice?: number | undefined;
    }[];
    tags?: string[] | undefined;
    media?: {
        url: string;
        alt?: string | undefined;
        width?: number | undefined;
        height?: number | undefined;
    }[] | undefined;
    seo?: {
        description?: string | undefined;
        title?: string | undefined;
        keywords?: string[] | undefined;
        canonical?: string | undefined;
    } | undefined;
}>;
export declare const addressSchema: z.ZodObject<{
    line1: z.ZodString;
    line2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodString;
    postalCode: z.ZodString;
    country: z.ZodString;
    label: z.ZodOptional<z.ZodString>;
    isDefault: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    line2?: string | undefined;
    label?: string | undefined;
    isDefault?: boolean | undefined;
}, {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    line2?: string | undefined;
    label?: string | undefined;
    isDefault?: boolean | undefined;
}>;
export declare const phoneOtpSchema: z.ZodObject<{
    phoneNumber: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phoneNumber: string;
}, {
    phoneNumber: string;
}>;
export declare const authSessionSchema: z.ZodObject<{
    idToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    idToken: string;
}, {
    idToken: string;
}>;
export declare const paymentCreateOrderSchema: z.ZodObject<{
    orderId: z.ZodString;
    amount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    orderId: string;
    amount: number;
}, {
    orderId: string;
    amount: number;
}>;
export declare const cartItemSchema: z.ZodObject<{
    productId: z.ZodString;
    variantSku: z.ZodString;
    quantity: z.ZodNumber;
    unitPrice: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    productId: string;
    variantSku: string;
    quantity: number;
    unitPrice: number;
}, {
    productId: string;
    variantSku: string;
    quantity: number;
    unitPrice: number;
}>;
export declare const createOrderSchema: z.ZodObject<{
    customerId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        variantSku: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        variantSku: string;
        quantity: number;
        unitPrice: number;
    }, {
        productId: string;
        variantSku: string;
        quantity: number;
        unitPrice: number;
    }>, "many">;
    shippingAddress: z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodString;
        postalCode: z.ZodString;
        country: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        isDefault: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        line1: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
        label?: string | undefined;
        isDefault?: boolean | undefined;
    }, {
        line1: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
        label?: string | undefined;
        isDefault?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    items: {
        productId: string;
        variantSku: string;
        quantity: number;
        unitPrice: number;
    }[];
    shippingAddress: {
        line1: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
        label?: string | undefined;
        isDefault?: boolean | undefined;
    };
}, {
    customerId: string;
    items: {
        productId: string;
        variantSku: string;
        quantity: number;
        unitPrice: number;
    }[];
    shippingAddress: {
        line1: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
        label?: string | undefined;
        isDefault?: boolean | undefined;
    };
}>;
export declare const paymentVerificationSchema: z.ZodObject<{
    orderId: z.ZodString;
    razorpayOrderId: z.ZodString;
    razorpayPaymentId: z.ZodString;
    razorpaySignature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}, {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}>;
export type ProductInput = z.infer<typeof productSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreatePaymentOrderInput = z.infer<typeof paymentCreateOrderSchema>;
//# sourceMappingURL=index.d.ts.map