// shop-filters.jsx — bottom-sheet filter panel (tier · price · fit · availability)

const EMPTY_FILTERS = {
  tiers: [],
  fits: [],
  price: [PRICE_BOUNDS.min, PRICE_BOUNDS.max],
  inStock: false,
};

// pure filter application — used by the grid
function applyFilters(list, f) {
  return list.filter((p) => {
    if (f.tiers.length && !f.tiers.includes(p.tier)) return false;
    if (f.fits.length && !f.fits.includes(p.fit)) return false;
    if (p.price < f.price[0] || p.price > f.price[1]) return false;
    if (f.inStock && p.stock <= 0) return false;
    return true;
  });
}

function countActive(f) {
  let n = 0;
  n += f.tiers.length;
  n += f.fits.length;
  if (f.price[0] > PRICE_BOUNDS.min || f.price[1] < PRICE_BOUNDS.max) n += 1;
  if (f.inStock) n += 1;
  return n;
}

// dual-thumb price range built on two overlaid native range inputs
function PriceRange({ value, onChange }) {
  const { min, max, step } = PRICE_BOUNDS;
  const [lo, hi] = value;
  const pct = (v) => ((v - min) / (max - min)) * 100;
  const setLo = (v) => onChange([Math.min(Number(v), hi - step), hi]);
  const setHi = (v) => onChange([lo, Math.max(Number(v), lo + step)]);
  return (
    <div className="frange">
      <div className="frange-track">
        <div className="frange-fill" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input type="range" min={min} max={max} step={step} value={lo}
               onChange={(e) => setLo(e.target.value)} aria-label="Minimum price" />
        <input type="range" min={min} max={max} step={step} value={hi}
               onChange={(e) => setHi(e.target.value)} aria-label="Maximum price" />
      </div>
      <div className="frange-vals">
        <span>₹{lo}</span>
        <span className="dash">—</span>
        <span>₹{hi}{hi >= max ? '+' : ''}</span>
      </div>
    </div>
  );
}

function FilterSheet({ open, onClose, value, onChange, resultCount }) {
  const f = value;
  const toggleIn = (key, id) => {
    const cur = f[key];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    onChange({ ...f, [key]: next });
  };
  const active = countActive(f);

  return (
    <>
      {open && <div className="drw-scrim" onClick={onClose} />}
      <aside className={`fsheet ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Filters">
        <div className="fsheet-grab" />
        <div className="fsheet-head">
          <div className="fsheet-title">FILTERS {active > 0 && <em>· {active}</em>}</div>
          <button className="drw-x" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>

        <div className="fsheet-body">
          {/* TIER */}
          <div className="fgroup">
            <div className="fgroup-h">TIER</div>
            <div className="fchips">
              {FILTER_TIERS.map((t) => (
                <button key={t.id}
                        className={`fchip ${f.tiers.includes(t.id) ? 'on' : ''}`}
                        onClick={() => toggleIn('tiers', t.id)}>
                  <span className="sw" style={{ background: t.sw }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* PRICE */}
          <div className="fgroup">
            <div className="fgroup-h">PRICE <span className="fgroup-note">INCL GST</span></div>
            <PriceRange value={f.price} onChange={(p) => onChange({ ...f, price: p })} />
          </div>

          {/* FIT */}
          <div className="fgroup">
            <div className="fgroup-h">FIT</div>
            <div className="fseg">
              {FILTER_FITS.map((fit) => (
                <button key={fit.id}
                        className={`fseg-b ${f.fits.includes(fit.id) ? 'on' : ''}`}
                        onClick={() => toggleIn('fits', fit.id)}>
                  {fit.label}
                </button>
              ))}
            </div>
          </div>

          {/* AVAILABILITY */}
          <div className="fgroup">
            <div className="fgroup-h">AVAILABILITY</div>
            <button className={`frow ${f.inStock ? 'on' : ''}`} onClick={() => onChange({ ...f, inStock: !f.inStock })}>
              <span>In stock only</span>
              <span className="fswitch"><i /></span>
            </button>
          </div>
        </div>

        <div className="fsheet-foot">
          <button className="fsheet-clear" onClick={() => onChange({ ...EMPTY_FILTERS, price: [PRICE_BOUNDS.min, PRICE_BOUNDS.max] })}>
            CLEAR ALL
          </button>
          <button className="fsheet-apply" onClick={onClose}>
            SHOW {resultCount} {resultCount === 1 ? 'PIECE' : 'PIECES'}
          </button>
        </div>
      </aside>
    </>
  );
}

Object.assign(window, { EMPTY_FILTERS, applyFilters, countActive, FilterSheet });
