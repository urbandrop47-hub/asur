// shop-drawers.jsx — left nav drawer + right cart drawer

function Scrim({ onClose }) {
  return <div className="drw-scrim" onClick={onClose} />;
}

function NavDrawer({ open, onClose }) {
  return (
    <>
      {open && <Scrim onClose={onClose} />}
      <aside className={`drw drw-left ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu">
        <div className="drw-head">
          <span className="s-logo" style={{ fontSize: 22 }}>ASUR<sup>IN</sup></span>
          <button className="drw-x" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <nav className="drw-cats">
          {NAV_CATEGORIES.map((c) => (
            <a href="#" key={c.label} onClick={onClose}>
              <span>{c.label}</span>
              {c.arrow && <Icon name="chevron" className="ar" />}
            </a>
          ))}
        </nav>
        <div className="drw-account">
          {NAV_ACCOUNT.map((a) => (
            <a href="#" key={a.label} className={a.full ? 'full' : ''} onClick={onClose}>{a.label}</a>
          ))}
        </div>
        <div className="drw-foot-note">
          <span className="deva">असुर</span>
          <span className="mono">NEITHER DIVINE · NOR DAMNED</span>
        </div>
      </aside>
    </>
  );
}

function CartDrawer({ open, onClose, items, onRemove, onCheckout, onOpen }) {
  const empty = !items || items.length === 0;
  const subtotal = (items || []).reduce((s, it) => s + it.price * it.qty, 0);
  return (
    <>
      {open && <Scrim onClose={onClose} />}
      <aside className={`drw drw-right ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Cart">
        <div className="drw-head light">
          <span className="cart-h">MY CART {!empty && <em>· {items.length}</em>}</span>
          <button className="drw-x dark" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>

        {empty ? (
          <div className="cart-empty">
            <div className="cart-empty-art">
              <div className="ce-stack"><span/><span/><span/></div>
            </div>
            <h3>YOUR CART IS COLD.</h3>
            <p>Nothing claimed yet. The Founding Three won't restock — move while they're live.</p>
            <button className="cart-empty-cta" onClick={onClose}>ENTER THE DROP <Icon name="arrow" /></button>
          </div>
        ) : (
          <div className="cart-list">
            {items.map((it) => (
              <div className="cart-line" key={it.id + (it.size || '')}>
                <div className="cart-line-media"><CardPlaceholder design={it} /></div>
                <div className="cart-line-info">
                  <div className="cart-line-title">{it.deva && <span className="deva">{it.deva}</span>}{it.title}</div>
                  <div className="cart-line-meta">QTY {it.qty} · SIZE {it.size || 'M'}</div>
                  <div className="cart-line-bottom">
                    <span className="cart-line-price">₹{it.price * it.qty}</span>
                    <button className="cart-line-rm" onClick={() => onRemove(it.id)}>REMOVE</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* recently viewed rail */}
        <div className="cart-rv">
          <div className="cart-rv-h">RECENTLY VIEWED</div>
          <div className="cart-rv-rail">
            {RECENTLY_VIEWED.map((p) => <MiniCard key={p.id} p={p} onOpen={onOpen} />)}
          </div>
        </div>

        {!empty && (
          <div className="cart-foot">
            <div className="cart-sub"><span>SUBTOTAL</span><b>₹{subtotal}</b></div>
            <button className="cart-checkout" onClick={onCheckout}>CHECKOUT <Icon name="arrow" /></button>
          </div>
        )}
      </aside>
    </>
  );
}

Object.assign(window, { NavDrawer, CartDrawer, Scrim });
