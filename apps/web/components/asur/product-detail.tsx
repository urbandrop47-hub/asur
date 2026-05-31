'use client';

import { useState } from 'react';
import type { Product, CartItem } from '@/lib/asur-catalog';
import { PDP_BOOK, GALLERY_ANGLES, FILTER_TIERS, SIZE_RUN, SHOP_PRODUCTS } from '@/lib/asur-catalog';
import { CardPlaceholder, WoodblockField } from './patterns';
import { MiniCard } from './product-card';
import { Icon } from './icons';

function angleDesign(p: Product, angleKey: string): Product {
  if (angleKey === 'back') return { ...p, stampPosition: 'back' };
  if (angleKey === 'detail') return { ...p, stampPosition: p.stampPosition === 'left-chest' ? 'left-chest' : 'chest' };
  if (angleKey === 'onbody') return { ...p, stampPosition: 'word' };
  return p;
}

function PdpGallery({ p }: { p: Product }) {
  const [angle, setAngle] = useState(0);
  const a = GALLERY_ANGLES[angle];
  return (
    <div className="pdp-gallery">
      <div className="pdp-main">
        <span className={`pcard-badge ${p.badgeClass}`}>{p.badge}</span>
        <CardPlaceholder design={angleDesign(p, a.key)} />
        <div className="pdp-angle-cap"><b>{a.label}</b> · {p.fit} FIT · BLACK TEE</div>
      </div>
      <div className="pdp-thumbs">
        {GALLERY_ANGLES.map((g, i) => (
          <button key={g.key} className={`pdp-thumb ${i === angle ? 'on' : ''}`} onClick={() => setAngle(i)}>
            <CardPlaceholder design={angleDesign(p, g.key)} />
            <span className="pdp-thumb-l">{g.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SizeSelector({ soldSizes, value, onChange }: { soldSizes: string[]; value: string | null; onChange: (s: string) => void }) {
  return (
    <div className="pdp-sizes">
      <div className="pdp-sizes-head">
        <span>SELECT SIZE</span>
        <button className="pdp-guide"><Icon name="ruler" /> SIZE GUIDE</button>
      </div>
      <div className="pdp-size-row">
        {SIZE_RUN.map((s) => {
          const out = soldSizes.includes(s);
          return (
            <button key={s} className={`pdp-size ${value === s ? 'on' : ''} ${out ? 'out' : ''}`}
                    disabled={out} onClick={() => !out && onChange(s)}>
              {s}
            </button>
          );
        })}
      </div>
      {soldSizes.length > 0 && <div className="pdp-size-note">{soldSizes.join(' · ')} sold out · no restock</div>}
    </div>
  );
}

function PdpLore({ p, book }: { p: Product; book: (typeof PDP_BOOK)[string] }) {
  return (
    <section className="pdp-lore">
      <div className="pdp-lore-bg">
        <WoodblockField variant={p.bgVariant} intensity={1} color="var(--accent)" />
      </div>
      <div className="pdp-lore-inner">
        <div className="pdp-lore-deva">{p.deva || 'असुर'}</div>
        <div className="pdp-lore-kicker">THE LORE · {p.n}</div>
        <h3 className="pdp-lore-sub">{book.sub}</h3>
        <p>{book.lore}</p>
      </div>
    </section>
  );
}

function PdpSpecs({ book, p }: { book: (typeof PDP_BOOK)[string]; p: Product }) {
  const specs = [
    { k: 'WEIGHT', v: `${book.gsm} GSM` },
    { k: 'CUT', v: book.cut },
    { k: 'PRINT', v: book.print },
    { k: 'TIER', v: FILTER_TIERS.find((t) => t.id === p.tier)?.label || p.tier },
    { k: 'CARE', v: 'Cold wash · inside out · no iron on print' },
    { k: 'ORIGIN', v: 'Cut & sewn in India' },
  ];
  return (
    <section className="pdp-specs">
      <div className="pdp-sec-h">THE CLOTH</div>
      <dl className="pdp-spec-grid">
        {specs.map((s) => (
          <div className="pdp-spec" key={s.k}>
            <dt>{s.k}</dt>
            <dd>{s.v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const PDP_REVIEWS = [
  { who: 'Aarav M.', size: 'Bought L', txt: 'Heavier than I expected — the print sits flat, no cracking after three washes. The lore card in the box was a nice touch.' },
  { who: 'Ishita R.', size: 'Bought M', txt: 'Oversized is genuinely oversized. The Devanagari work is cleaner in person than the mockups. Wish I had grabbed two.' },
];

function PdpReviews({ p }: { p: Product }) {
  return (
    <section className="pdp-reviews">
      <div className="pdp-rev-top">
        <div className="pdp-rev-score">
          <span className="big">{p.rating.toFixed(1)}</span>
          <span className="stars">★★★★★</span>
          <span className="cnt">{p.reviews} REVIEWS</span>
        </div>
        <button className="pdp-rev-all">READ ALL <Icon name="chevron" /></button>
      </div>
      <div className="pdp-rev-list">
        {PDP_REVIEWS.map((r) => (
          <div className="pdp-rev" key={r.who}>
            <div className="pdp-rev-h">
              <span className="stars sm">★★★★★</span>
              <span className="who">{r.who} · <i>{r.size}</i></span>
            </div>
            <p>{r.txt}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

interface ProductDetailProps {
  p: Product;
  onClose: () => void;
  onAdd: (p: CartItem) => void;
  onOpen: (p: Product) => void;
  cartCount: number;
  onCart: () => void;
}

export function ProductDetail({ p, onClose, onAdd, onOpen, cartCount, onCart }: ProductDetailProps) {
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const book = PDP_BOOK[p.id] || PDP_BOOK.p1;
  const low = p.stock <= 7;
  const pct = Math.round((p.stock / p.cap) * 100);
  const related = SHOP_PRODUCTS.filter((x) => x.id !== p.id).slice(0, 6);

  const add = () => {
    if (!size) return;
    onAdd({ ...p, qty: 1, size });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="pdp">
      <header className="pdp-top">
        <button className="s-ic" onClick={onClose} aria-label="Back"><Icon name="arrowL" /></button>
        <div className="pdp-top-mid">{p.n} / 08</div>
        <div className="pdp-top-right">
          <button className="s-ic" aria-label="Share"><Icon name="share" /></button>
          <button className="s-ic" aria-label="Cart" onClick={onCart}>
            <Icon name="bag" />
            {cartCount > 0 && <span className="ct">{cartCount}</span>}
          </button>
        </div>
      </header>

      <div className="pdp-scroll">
        <PdpGallery p={p} />

        <div className="pdp-head">
          <div className="pdp-head-row">
            <span className="pdp-rate"><span className="star">★</span> {p.rating.toFixed(1)} <i>· {p.reviews}</i></span>
            <button className="pdp-wish-t"><Icon name="heart" /> SAVE</button>
          </div>
          <h1 className="pdp-title">{p.deva && <span className="deva">{p.deva}</span>}{p.title}</h1>
          <p className="pdp-sub">{book.sub}</p>
          <div className="pdp-price-row">
            <span className="pdp-price">₹{p.price}<small>INCL GST</small></span>
            <span className={`pdp-scarce ${low ? 'low' : ''}`}>
              {low ? `ONLY ${p.stock} LEFT` : `${p.stock} / ${p.cap} CLAIMED`}
              <span className="bar"><i style={{ width: `${pct}%` }} /></span>
            </span>
          </div>
        </div>

        <SizeSelector soldSizes={book.soldSizes} value={size} onChange={setSize} />

        <div className="pdp-ship">
          <span className="pdp-ship-ic"><Icon name="truck" /></span>
          <div>
            <b>Dispatch in 48 hrs</b>
            <i>Free shipping over ₹1499 · 7-day exchange on size</i>
          </div>
        </div>

        <PdpLore p={p} book={book} />
        <PdpSpecs book={book} p={p} />
        <PdpReviews p={p} />

        <section className="pdp-rel">
          <div className="pdp-sec-h">COMPLETE THE RITUAL</div>
          <div className="cart-rv-rail">
            {related.map((r) => <MiniCard key={r.id} p={r} onOpen={onOpen} />)}
          </div>
        </section>

        <div className="pdp-foot-note">
          <span className="deva">असुर</span>
          <span className="mono">NEITHER DIVINE · NOR DAMNED</span>
        </div>
      </div>

      <div className="pdp-addbar">
        <div className="pdp-addbar-price">
          <b>₹{p.price}</b>
          <i>{size ? `SIZE ${size}` : 'SELECT A SIZE'}</i>
        </div>
        <button className={`pdp-add ${added ? 'added' : ''} ${!size ? 'wait' : ''}`} onClick={add}>
          {added ? 'ADDED TO CART ✓' : size ? 'ADD TO CART' : 'SELECT SIZE'}
          {size && !added && <Icon name="arrow" />}
        </button>
      </div>
    </div>
  );
}
