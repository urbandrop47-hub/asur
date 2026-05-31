// shop-cards.jsx — UI icons + product cards (PLP)

const Icon = ({ name, className }) => {
  const p = {
    search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
    bag: <><path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></>,
    heart: <path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20z"/>,
    sliders: <><path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h2"/><path d="M10 17h10"/><circle cx="8" cy="17" r="2"/></>,
    sort: <><path d="M7 5v14"/><path d="M4 16l3 3 3-3"/><path d="M13 7h7"/><path d="M13 12h5"/><path d="M13 17h3"/></>,
    chevron: <path d="M9 6l6 6-6 6"/>,
    chevronD: <path d="M6 9l6 6 6-6"/>,
    arrow: <><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
    arrowL: <><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></>,
    x: <><path d="M6 6l12 12"/><path d="M18 6L6 18"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    minus: <path d="M5 12h14"/>,
    check: <path d="M4 12l5 5L20 6"/>,
    share: <><circle cx="6" cy="12" r="2.4"/><circle cx="17" cy="6" r="2.4"/><circle cx="17" cy="18" r="2.4"/><path d="M8.1 11l6.8-3.6M8.1 13l6.8 3.6"/></>,
    truck: <><rect x="2" y="7" width="12" height="9"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/></>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>,
    ruler: <><rect x="3" y="8" width="18" height="8" rx="1"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/></>,
    edit: <><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
    ig: <><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.5"/><circle cx="17" cy="7" r="1"/></>,
    wa: <path d="M5 19l1.3-3.8A7 7 0 1 1 9 18.2L5 19zM9.5 9c-.3 0-.6.3-.6.8 0 1.6 2.3 3.9 3.9 3.9.5 0 .8-.3.8-.6"/>,
    yt: <><rect x="4" y="6" width="16" height="12" rx="3"/><path d="M11 9.5l4 2.5-4 2.5z"/></>,
    xt: <path d="M5 5l14 14M19 5L5 19"/>,
  }[name];
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
         strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {p}
    </svg>
  );
};

// Stars rendered as a single fire glyph + numeric (commerce convention)
function RatingPill({ rating, reviews }) {
  return (
    <span className="pill">
      <span className="star">★</span>{rating.toFixed(1)}<span className="n">· {reviews}</span>
    </span>
  );
}

function ProductCard({ p, onAdd, onOpen }) {
  const [added, setAdded] = React.useState(false);
  const [wished, setWished] = React.useState(false);
  const low = p.stock <= 7;
  const pct = Math.round((p.stock / p.cap) * 100);
  const add = () => {
    setAdded(true);
    onAdd && onAdd(p);
    setTimeout(() => setAdded(false), 1400);
  };
  const open = () => onOpen && onOpen(p);
  return (
    <article className="pcard">
      <div className="pcard-media" onClick={open} style={{ cursor: 'pointer' }}>
        <span className={`pcard-badge ${p.badgeClass}`}>{p.badge}</span>
        <button className="pcard-wish" aria-label="Wishlist"
                onClick={(e) => { e.stopPropagation(); setWished(w => !w); }}
                style={wished ? { color: 'var(--accent)' } : null}>
          <Icon name="heart" />
        </button>
        <CardPlaceholder design={p} />
        <div className="pcard-pills">
          <RatingPill rating={p.rating} reviews={p.reviews} />
          <span className={`pill stock ${low ? 'low' : ''}`}>
            {low ? `${p.stock} LEFT` : `${p.stock}/${p.cap}`}
          </span>
        </div>
      </div>
      <div className="pcard-info">
        <div className="pcard-price">₹{p.price}<small>INCL GST</small></div>
        <div className={`pcard-scarce ${low ? '' : 'calm'}`}>
          <span>{low ? 'SELLING FAST' : 'IN STOCK'}</span>
          <span className="bar"><i style={{ width: `${pct}%` }} /></span>
          <span>{p.stock}/{p.cap}</span>
        </div>
        <div className="pcard-title" onClick={open} style={{ cursor: 'pointer' }}>
          {p.deva && <span className="deva">{p.deva}</span>}{p.title}
        </div>
        <button className={`pcard-cart ${added ? 'added' : ''}`} onClick={add}>
          {added ? 'ADDED ✓' : 'ADD TO CART'}
        </button>
      </div>
    </article>
  );
}

// Mini card for the "recently viewed" rail in the cart drawer
function MiniCard({ p, onOpen }) {
  return (
    <article className="mini" onClick={() => onOpen && onOpen(p)} style={onOpen ? { cursor: 'pointer' } : null}>
      <div className="mini-media">
        <CardPlaceholder design={{ ...p, accent: 'var(--accent)' }} />
        <button className="mini-add" aria-label="Add"><Icon name="bag" /></button>
      </div>
      <div className="mini-price">₹{p.price}</div>
      <div className="mini-rate"><span className="star">★</span>{p.rating.toFixed(1)} <span className="n">· {p.reviews}</span></div>
      <div className="mini-title">{p.deva && <span className="deva">{p.deva}</span>}{p.title}</div>
    </article>
  );
}

Object.assign(window, { Icon, RatingPill, ProductCard, MiniCard });
