// shop-app.jsx — ASUR mobile shop (PLP) composition

const { useState, useEffect, useRef } = React;

function TopBar({ cartCount, onMenu, onCart }) {
  return (
    <header className="s-top">
      <div className="s-top-left">
        <button className="s-burger" aria-label="Menu" onClick={onMenu}><span/><span/><span/></button>
      </div>
      <div className="s-logo">ASUR<sup>IN</sup></div>
      <div className="s-top-right">
        <button className="s-ic" aria-label="Search"><Icon name="search" /></button>
        <button className="s-ic" aria-label="Cart" onClick={onCart}>
          <Icon name="bag" />
          {cartCount > 0 && <span className="ct">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
}

function HeroBanner() {
  return (
    <section className="s-hero">
      <div className="s-hero-card">
        <div className="s-hero-art">
          <div style={{ position: 'absolute', inset: 0, color: 'var(--accent)', opacity: 0.22 }}>
            <WoodblockField variant="rays" intensity={1.1} color="currentColor" />
          </div>
          <div className="s-hero-deva" aria-hidden="true">असुर</div>
        </div>
        <div className="s-hero-grad" />
        <div className="s-hero-body">
          <span className="s-hero-kicker">FOUNDING DROP · LIVE NOW</span>
          <h1 className="s-hero-title">NEITHER<br/>DIVINE.<br/><em>NOR DAMNED.</em></h1>
          <a href="#grid" className="s-hero-cta">ENTER THE DROP <Icon name="arrow" /></a>
        </div>
      </div>
    </section>
  );
}

function ProductGrid({ products, onAdd, onOpen }) {
  return (
    <div className="s-grid" id="grid">
      {products.map((p) => <ProductCard key={p.id} p={p} onAdd={onAdd} onOpen={onOpen} />)}
    </div>
  );
}

function StickyBar({ onFilter, onSort, sort, activeFilters }) {
  return (
    <div className="s-stickybar">
      <div className="s-stickybar-inner">
        <button onClick={onFilter}>
          <Icon name="sliders" /> FILTERS
          {activeFilters > 0 && <span className="s-filter-ct">{activeFilters}</span>}
        </button>
        <button onClick={onSort} className="col">
          <span><Icon name="sort" style={{ verticalAlign: '-3px', marginRight: 8 }} />SORT BY</span>
          <small>{sort}</small>
        </button>
      </div>
    </div>
  );
}

const SORTS = ['Featured', 'Newest Drop', 'Selling Fast', 'Price ↑', 'Price ↓'];

// quick-filter chips compose (AND) with the filter sheet
function chipMatches(p, chip) {
  switch (chip) {
    case 'ALL': return true;
    case 'FOUNDING': return p.tier === 'FOUNDING';
    case 'CORE': return p.tier === 'CORE';
    case 'GOLD TIER': return p.tier === 'GOLD';
    case 'BLOOD DROP': return p.tier === 'BLOOD';
    case 'OVERSIZED': return p.fit === 'OVERSIZED';
    case 'BACK-PRINT': return p.stampPosition === 'back' || p.stampPosition === 'manifesto';
    default: return true;
  }
}

function ShopApp() {
  const [t, setTweak] = useTweaks(SHOP_TWEAKS);
  const [navOpen, setNavOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [chip, setChip] = useState('ALL');
  const [sortIdx, setSortIdx] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, price: [PRICE_BOUNDS.min, PRICE_BOUNDS.max] });
  const [view, setView] = useState('plp');         // 'plp' | 'pdp' | 'checkout'
  const [activeProduct, setActiveProduct] = useState(null);

  useEffect(() => { document.documentElement.style.setProperty('--accent', t.accent); }, [t.accent]);
  useEffect(() => {
    const anyOpen = navOpen || cartOpen || filterOpen || view !== 'plp';
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [navOpen, cartOpen, filterOpen, view]);

  // demo cart preview tweak
  useEffect(() => {
    if (t.demoCart) {
      setCart([
        { ...SHOP_PRODUCTS[1], qty: 1, size: 'L' },
        { ...SHOP_PRODUCTS[3], qty: 2, size: 'M' },
      ]);
    } else {
      setCart([]);
    }
  }, [t.demoCart]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const addToCart = (p) => {
    setCart((c) => {
      const key = (it) => it.id + (it.size || '');
      const found = c.find((it) => key(it) === key(p));
      if (found) return c.map((it) => key(it) === key(p) ? { ...it, qty: it.qty + 1 } : it);
      return [...c, { ...p, qty: 1 }];
    });
  };
  const removeFromCart = (id) => setCart((c) => c.filter((it) => it.id !== id));
  const cartCount = cart.reduce((s, it) => s + it.qty, 0);

  const openPdp = (p) => { setActiveProduct(p); setView('pdp'); window.scrollTo(0, 0); };
  const openCheckout = () => { setCartOpen(false); setView('checkout'); };

  // filter (sheet) + chip + sort
  let products = applyFilters(SHOP_PRODUCTS, filters).filter((p) => chipMatches(p, chip));
  const sort = SORTS[sortIdx];
  if (sort === 'Selling Fast') products.sort((a, b) => a.stock - b.stock);
  else if (sort === 'Price ↑') products.sort((a, b) => a.price - b.price);
  else if (sort === 'Price ↓') products.sort((a, b) => b.price - a.price);
  else if (sort === 'Newest Drop') products.sort((a, b) => b.n.localeCompare(a.n));

  const activeFilters = countActive(filters);

  return (
    <div className="shop">
      <PatternDefs />
      <div className="s-announce">NO RESTOCK · NO APOLOGY · FREE SHIPPING OVER ₹1499</div>
      <TopBar cartCount={cartCount} onMenu={() => setNavOpen(true)} onCart={() => setCartOpen(true)} />

      <HeroBanner />

      <div className="s-sec">
        <h2>FOUNDING THREE</h2>
        <span className="count"><b>{products.length}</b> {products.length === 1 ? 'PIECE' : 'PIECES'}</span>
      </div>

      <div className="s-chips">
        {SHOP_CHIPS.map((c) => (
          <button key={c} className={`s-chip ${chip === c ? 'on' : ''}`} onClick={() => setChip(c)}>{c}</button>
        ))}
      </div>

      {products.length > 0 ? (
        <ProductGrid products={products} onAdd={addToCart} onOpen={openPdp} />
      ) : (
        <div className="s-empty">
          <div className="s-empty-deva">शून्य</div>
          <h3>NOTHING MATCHES.</h3>
          <p>No pieces fit those filters. Loosen the constraints — or wait for the next drop.</p>
          <button onClick={() => { setFilters({ ...EMPTY_FILTERS, price: [PRICE_BOUNDS.min, PRICE_BOUNDS.max] }); setChip('ALL'); }}>
            CLEAR FILTERS
          </button>
        </div>
      )}

      <ShopFooter />

      <StickyBar
        sort={sort}
        activeFilters={activeFilters}
        onFilter={() => setFilterOpen(true)}
        onSort={() => setSortIdx((i) => (i + 1) % SORTS.length)}
      />

      <button className={`s-totop ${showTop ? 'show' : ''}`} aria-label="Back to top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>

      <NavDrawer open={navOpen} onClose={() => setNavOpen(false)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} items={cart}
                  onRemove={removeFromCart} onCheckout={openCheckout} onOpen={(p) => { setCartOpen(false); openPdp(p); }} />
      <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)}
                   value={filters} onChange={setFilters} resultCount={products.length} />

      {view === 'pdp' && activeProduct && (
        <ProductDetail p={activeProduct} onClose={() => setView('plp')} onAdd={addToCart}
                       onOpen={openPdp} cartCount={cartCount} onCart={() => setCartOpen(true)} />
      )}
      {view === 'checkout' && (
        <Checkout items={cart.length ? cart : [{ ...SHOP_PRODUCTS[0], qty: 1, size: 'M' }]}
                  onClose={() => setView('plp')}
                  onComplete={() => { if (!t.demoCart) setCart([]); }} />
      )}

      <TweaksPanel>
        <TweakSection label="Brand accent" />
        <TweakColor label="Accent" value={t.accent}
          options={['#D45A1A', '#8B1A1A', '#C4921A', '#E8E0D0']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Preview" />
        <TweakToggle label="Demo cart (filled)" value={t.demoCart}
          onChange={(v) => setTweak('demoCart', v)} />
      </TweaksPanel>
    </div>
  );
}

const SHOP_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#D45A1A",
  "demoCart": false
}/*EDITMODE-END*/;

ReactDOM.createRoot(document.getElementById('root')).render(<ShopApp />);
