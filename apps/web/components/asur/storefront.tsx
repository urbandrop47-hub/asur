'use client';

import { useState, useEffect } from 'react';
import type { Product, CartItem, Filters } from '@/lib/asur-catalog';
import {
  SHOP_PRODUCTS, SHOP_CHIPS, WEB_SORTS, EMPTY_FILTERS, PRICE_BOUNDS,
  applyFilters, countActive, webChipMatches,
} from '@/lib/asur-catalog';

import { PatternDefs } from './patterns';
import { ProductCard } from './product-card';
import { NavDrawer, CartDrawer } from './drawers';
import { FilterSheet } from './filter-sheet';
import { ProductDetail } from './product-detail';
import { Checkout } from './checkout';
import { ShopFooter } from './shop-footer';
import { SideBar, TopBarCompact, UtilBar, WebHero } from './layout-shell';
import { Icon } from './icons';

type View = 'plp' | 'pdp' | 'checkout';

export function Storefront() {
  const [navOpen, setNavOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [chip, setChip] = useState('ALL');
  const [activeCat, setActiveCat] = useState('FOUNDING THREE');
  const [sortIdx, setSortIdx] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, price: [PRICE_BOUNDS.min, PRICE_BOUNDS.max] });
  const [view, setView] = useState<View>('plp');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // body scroll lock when any overlay is open
  useEffect(() => {
    const anyOverlay = navOpen || cartOpen || filterOpen || view !== 'plp';
    document.body.style.overflow = anyOverlay ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [navOpen, cartOpen, filterOpen, view]);

  // back-to-top FAB
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const addToCart = (p: CartItem | Product) => setCart((c) => {
    const key = (it: CartItem) => it.id + (it.size || '');
    const incoming = 'qty' in p ? p : { ...p, qty: 1, size: '' };
    const found = c.find((it) => key(it) === key(incoming as CartItem));
    if (found) return c.map((it) => key(it) === key(incoming as CartItem) ? { ...it, qty: it.qty + 1 } : it);
    return [...c, incoming as CartItem];
  });

  const removeFromCart = (id: string) => setCart((c) => c.filter((it) => it.id !== id));
  const cartCount = cart.reduce((s, it) => s + it.qty, 0);

  const openPdp = (p: Product) => {
    setActiveProduct(p);
    setView('pdp');
    window.scrollTo(0, 0);
  };
  const openCheckout = () => { setCartOpen(false); setView('checkout'); };

  // compute visible products
  let products = applyFilters(SHOP_PRODUCTS, filters).filter((p) => webChipMatches(p, chip));
  const sort = WEB_SORTS[sortIdx];
  if (sort === 'Selling Fast') products = [...products].sort((a, b) => a.stock - b.stock);
  else if (sort === 'Price ↑') products = [...products].sort((a, b) => a.price - b.price);
  else if (sort === 'Price ↓') products = [...products].sort((a, b) => b.price - a.price);
  else if (sort === 'Newest Drop') products = [...products].sort((a, b) => b.n.localeCompare(a.n));

  const activeFilters = countActive(filters);
  const resetAll = () => {
    setFilters({ ...EMPTY_FILTERS, price: [PRICE_BOUNDS.min, PRICE_BOUNDS.max] });
    setChip('ALL');
  };

  return (
    <div className="site">
      <PatternDefs />
      <div className="web-announce">NO RESTOCK · NO APOLOGY · FREE SHIPPING OVER ₹1499</div>

      <TopBarCompact
        cartCount={cartCount}
        onMenu={() => setNavOpen(true)}
        onCart={() => setCartOpen(true)}
      />

      <div className="site-grid">
        <SideBar
          activeCat={activeCat}
          onCat={(c) => { setActiveCat(c); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />

        <div className="main">
          <UtilBar cartCount={cartCount} onCart={() => setCartOpen(true)} />

          <div className="main-inner">
            <WebHero />

            <div className="web-section-head" id="grid">
              <h2><span className="deva">द्रोह </span>{activeCat}</h2>
              <span className="web-section-sub">
                <b>{products.length}</b> {products.length === 1 ? 'PIECE' : 'PIECES'} · NO RESTOCK
              </span>
            </div>

            <div className="web-toolbar">
              <div className="web-chips">
                {SHOP_CHIPS.map((c) => (
                  <button key={c} className={`web-chip ${chip === c ? 'on' : ''}`} onClick={() => setChip(c)}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="web-tools-right">
                <button className="web-filter-btn" onClick={() => setFilterOpen(true)}>
                  <Icon name="sliders" /> FILTERS
                  {activeFilters > 0 && <span className="s-filter-ct">{activeFilters}</span>}
                </button>
                <div className="web-sort">
                  <select value={sortIdx} onChange={(e) => setSortIdx(Number(e.target.value))} aria-label="Sort by">
                    {WEB_SORTS.map((s, i) => (
                      <option key={s} value={i}>SORT · {s.toUpperCase()}</option>
                    ))}
                  </select>
                  <Icon name="chevronD" />
                </div>
              </div>
            </div>

            {products.length > 0 ? (
              <div className="web-grid" id="product-grid">
                {products.map((p) => (
                  <ProductCard key={p.id} p={p} onAdd={addToCart} onOpen={openPdp} />
                ))}
              </div>
            ) : (
              <div className="s-empty web-empty">
                <div className="s-empty-deva">शून्य</div>
                <h3>NOTHING MATCHES.</h3>
                <p>No pieces fit those filters. Loosen the constraints — or wait for the next drop.</p>
                <button onClick={resetAll}>CLEAR FILTERS</button>
              </div>
            )}
          </div>

          <div className="web-foot">
            <div className="web-foot-inner">
              <ShopFooter />
            </div>
          </div>
        </div>
      </div>

      <button
        className={`web-totop ${showTop ? 'show' : ''}`}
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >↑</button>

      {/* Drawers */}
      <NavDrawer open={navOpen} onClose={() => setNavOpen(false)} />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onRemove={removeFromCart}
        onCheckout={openCheckout}
        onOpen={(p) => { setCartOpen(false); openPdp(p); }}
      />
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={filters}
        onChange={setFilters}
        resultCount={products.length}
      />

      {/* PDP overlay */}
      {view === 'pdp' && activeProduct && (
        <ProductDetail
          p={activeProduct}
          onClose={() => setView('plp')}
          onAdd={addToCart}
          onOpen={openPdp}
          cartCount={cartCount}
          onCart={() => { setView('plp'); setCartOpen(true); }}
        />
      )}

      {/* Checkout overlay */}
      {view === 'checkout' && (
        <Checkout
          items={cart.length ? cart : [{ ...SHOP_PRODUCTS[0], qty: 1, size: 'M' }]}
          onClose={() => setView('plp')}
          onComplete={() => setCart([])}
        />
      )}
    </div>
  );
}
