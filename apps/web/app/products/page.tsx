import { AppShell, Button, Pill } from "@asur/ui";
import { featuredProducts } from "../../lib/catalog";
import { ProductCard } from "../../components/product-card";

export default function ProductsPage() {
  return (
    <div className="stack">
      <div className="section-title">
        <div>
          <h1>Products</h1>
          <p>Curated drop-ready product cards, ready to be backed by MongoDB content and Cloudflare R2 media.</p>
        </div>
        <Button href="/cart">Go to cart</Button>
      </div>

      <AppShell
        title="Merchandise catalog"
        subtitle="Products are shaped around variants, inventory, and premium visual storytelling."
      >
        <div className="actions">
          <Pill tone="success">MongoDB Atlas</Pill>
          <Pill tone="info">Variants</Pill>
          <Pill tone="warning">SEO-ready</Pill>
        </div>
      </AppShell>

      <div className="grid-3">
        {featuredProducts.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
