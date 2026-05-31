// web-app.jsx — ASUR responsive website shell (desktop sidebar + wide grid)
// Reuses every module from the mobile build: data, patterns, cards, drawers,
// filters, PDP, checkout, footer. Root class is `.site` (NOT `.shop`) so it
// escapes the phone-frame CSS that shop.css applies at >=768px.

const { useState: useWState, useEffect: useWEffect, useRef: useWRef } = React;

const WEB_SORTS = ['Featured', 'Newest Drop', 'Selling Fast', 'Price ↑', 'Price ↓'];

function webChipMatches(p, chip) {
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

// ── desktop sidebar ───────────────────────────────────────────────────
function SideBar({ activeCat, onCat }) {
  return (
    <aside className="side">
      <div className="side-logo">ASUR<sup>IN</sup></div>
      <div className="side-tag">Neither divine · Nor damned</div>
      <nav className="side-nav">
        {NAV_CATEGORIES.map((c, i) => (
          <a href="#grid" key={c.label}
             className={activeCat === c.label ? 'on' : ''}
             onClick={(e) => { e.preventDefault(); onCat(c.label); }}>
            <span>{c.label}</span>
            <Icon name="chevron" className="ar" />
          </a>
        ))}
      </nav>
      <div className="side-account">
        {NAV_ACCOUNT.map((a) => (
          <a href="#" key={a.label} className={a.full ? 'full' : ''}>{a.label}</a>
        ))}
      </div>
      <div className="side-foot">
        <span className="deva">असुर</span>
        <span className="mono">© 2026 · MUMBAI · IN</span>
      </div>
    </aside>
  );
}

// ── compact top bar (tablet + mobile) ──────────────────────────────────
function TopBarCompact({ cartCount, onMenu, onCart }) {
  return (
    <header className="web-topbar">
      <button className="web-burger" aria-label="Menu" onClick={onMenu}><span/><span/><span/></button>
      <div className="web-topbar-logo">ASUR<sup>IN</sup></div>
      <div className="web-topbar-right">
        <button className="web-ic" aria-label="Search"><Icon name="search" /></button>
        <button className="web-ic" aria-label="Cart" onClick={onCart}>
          <Icon name="bag" />
          {cartCount > 0 && <span className="ct">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
}

// ── desktop utility bar inside main ─────────────────────────────────────
function UtilBar({ cartCount, onCart }) {
  return (
    <div className="web-util">
      <div className="web-search">
        <Icon name="search" />
        <input placeholder="SEARCH THE DROP — रावण, GOLD TIER, BACK-PRINT…" aria-label="Search" />
      </div>
      <div className="web-util-right">
        <a href="#" className="web-util-link">THE LORE</a>
        <a href="#" className="web-util-link">TRACK ORDER</a>
        <button className="web-ic" aria-label="Wishlist"><Icon name="heart" /></button>
        <button className="web-ic" aria-label="Account"><Icon name="bag" style={{ opacity: 0 }} /><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', width: 20, height: 20 }}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg></button>
        <button className="web-ic" aria-label="Cart" onClick={onCart}>
          <Icon name="bag" />
          {cartCount > 0 && <span className="ct">{cartCount}</span>}
        </button>
      </div>
    </div>
  );
}

// ── desktop landscape hero ──────────────────────────────────────────────
function WebHero() {
  return (
    <section className="web-hero" id="top">
      <div className="web-hero-card">
        <div className="web-hero-art">
          <div style={{ position: 'absolute', inset: 0, color: 'var(--accent)', opacity: 0.22 }}>
            <WoodblockField variant="rays" intensity={1.1} color="currentColor" />
          </div>
          <div className="web-hero-deva" aria-hidden="true">असुर</div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '58%', maxWidth: 380, aspectRatio: '5 / 6' }}>
              <TeeFrame />
              <BackStamp label="FOUNDING DROP · 01" deva="असुर" accent="var(--accent)" />
            </div>
          </div>
        </div>
        <div className="web-hero-body">
          <span className="web-hero-kicker">FOUNDING DROP · LIVE NOW</span>
          <h1 className="web-hero-title">NEITHER<br/>DIVINE.<br/><em>NOR DAMNED.</em></h1>
          <p className="web-hero-sub">Eight pieces. No restock. The asuras were never the evil ones — they were the friction the universe needed. Claim the Founding Three before the plates are destroyed.</p>
          <div className="web-hero-actions">
            <a href="#grid" className="web-cta">ENTER THE DROP <Icon name="arrow" /></a>
            <a href="#" className="web-cta ghost">READ THE LORE</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function WebApp() {
  const [t, setTweak] = useTweaks(WEB_TWEAKS);
  const [navOpen, setNavOpen] = useWState(false);
  const [cartOpen, setCartOpen] = useWState(false);
  const [filterOpen, setFilterOpen] = useWState(false);
  const [cart, setCart] = useWState([]);
  const [chip, setChip] = useWState('ALL');
  const [activeCat, setActiveCat] = useWState('FOUNDING THREE');
  const [sortIdx, setSortIdx] = useWState(0);
  const [showTop, setShowTop] = useWState(false);
  const [filters, setFilters] = useWState({ ...EMPTY_FILTERS, price: [PRICE_BOUNDS.min, PRICE_BOUNDS.max] });
  const [view, setView] = useWState('plp');
  const [activeProduct, setActiveProduct] = useWState(null);

  useWEffect(() => { document.documentElement.style.setProperty('--accent', t.accent); }, [t.accent]);

  useWEffect(() => {
    const anyOverlay = navOpen || cartOpen || filterOpen || view !== 'plp';
    document.body.style.overflow = anyOverlay ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [navOpen, cartOpen, filterOpen, view]);

  useWEffect(() => {
    if (t.demoCart) {
      setCart([
        { ...SHOP_PRODUCTS[1], qty: 1, size: 'L' },
        { ...SHOP_PRODUCTS[3], qty: 2, size: 'M' },
      ]);
    } else { setCart([]); }
  }, [t.demoCart]);

  useWEffect(() => {
    const onScroll = () => setShowTop((window.scrollY || 0) > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const addToCart = (p) => setCart((c) => {
    const key = (it) => it.id + (it.size || '');
    const found = c.find((it) => key(it) === key(p));
    if (found) return c.map((it) => key(it) === key(p) ? { ...it, qty: it.qty + 1 } : it);
    return [...c, { ...p, qty: 1 }];
  });
  const removeFromCart = (id) => setCart((c) => c.filter((it) => it.id !== id));
  const cartCount = cart.reduce((s, it) => s + it.qty, 0);

  const openPdp = (p) => { setActiveProduct(p); setView('pdp'); window.scrollTo(0, 0); };
  const openCheckout = () => { setCartOpen(false); setView('checkout'); };

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

      <TopBarCompact cartCount={cartCount} onMenu={() => setNavOpen(true)} onCart={() => setCartOpen(true)} />

      <div className="site-grid">
        <SideBar activeCat={activeCat} onCat={(c) => { setActiveCat(c); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />

        <div className="main">
          <UtilBar cartCount={cartCount} onCart={() => setCartOpen(true)} />

          <div className="main-inner">
            <WebHero />

            <div className="web-section-head" id="grid">
              <h2><span className="deva">द्रोह</span>{activeCat}</h2>
              <span className="web-section-sub"><b>{products.length}</b> {products.length === 1 ? 'PIECE' : 'PIECES'} · NO RESTOCK</span>
            </div>

            <div className="web-toolbar">
              <div className="web-chips">
                {SHOP_CHIPS.map((c) => (
                  <button key={c} className={`web-chip ${chip === c ? 'on' : ''}`} onClick={() => setChip(c)}>{c}</button>
                ))}
              </div>
              <div className="web-tools-right">
                <button className="web-filter-btn" onClick={() => setFilterOpen(true)}>
                  <Icon name="sliders" /> FILTERS
                  {activeFilters > 0 && <span className="s-filter-ct">{activeFilters}</span>}
                </button>
                <div className="web-sort">
                  <select value={sortIdx} onChange={(e) => setSortIdx(Number(e.target.value))} aria-label="Sort by">
                    {WEB_SORTS.map((s, i) => <option key={s} value={i}>SORT · {s.toUpperCase()}</option>)}
                  </select>
                  <Icon name="chevronD" />
                </div>
              </div>
            </div>

            {products.length > 0 ? (
              <div className="web-grid">
                {products.map((p) => <ProductCard key={p.id} p={p} onAdd={addToCart} onOpen={openPdp} />)}
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

      <button className={`web-totop ${showTop ? 'show' : ''}`} aria-label="Back to top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>

      <NavDrawer open={navOpen} onClose={() => setNavOpen(false)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} items={cart}
                  onRemove={removeFromCart} onCheckout={openCheckout}
                  onOpen={(p) => { setCartOpen(false); openPdp(p); }} />
      <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)}
                   value={filters} onChange={setFilters} resultCount={products.length} />

      {view === 'pdp' && activeProduct && (
        <ProductDetail p={activeProduct} onClose={() => setView('plp')} onAdd={addToCart}
                       onOpen={openPdp} cartCount={cartCount} onCart={() => { setView('plp'); setCartOpen(true); }} />
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

const WEB_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#D45A1A",
  "demoCart": false
}/*EDITMODE-END*/;

ReactDOM.createRoot(document.getElementById('root')).render(<WebApp />);
