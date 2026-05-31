'use client';

import { useState } from 'react';
import type { Product } from '@/lib/asur-catalog';
import { CardPlaceholder } from './patterns';
import { Icon } from './icons';

function RatingPill({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <span className="pill">
      <span className="star">★</span>{rating.toFixed(1)}<span className="n">· {reviews}</span>
    </span>
  );
}

interface ProductCardProps {
  p: Product;
  onAdd?: (p: Product) => void;
  onOpen?: (p: Product) => void;
}

export function ProductCard({ p, onAdd, onOpen }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const low = p.stock <= 7;
  const pct = Math.round((p.stock / p.cap) * 100);

  const add = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAdded(true);
    onAdd?.(p);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article className="pcard">
      <div className="pcard-media" onClick={() => onOpen?.(p)} style={{ cursor: 'pointer' }}>
        <span className={`pcard-badge ${p.badgeClass}`}>{p.badge}</span>
        <button className="pcard-wish" aria-label="Wishlist"
                onClick={(e) => { e.stopPropagation(); setWished(w => !w); }}
                style={wished ? { color: 'var(--accent)' } : undefined}>
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
        <div className="pcard-title" onClick={() => onOpen?.(p)} style={{ cursor: 'pointer' }}>
          {p.deva && <span className="deva">{p.deva}</span>}{p.title}
        </div>
        <button className={`pcard-cart ${added ? 'added' : ''}`} onClick={add}>
          {added ? 'ADDED ✓' : 'ADD TO CART'}
        </button>
      </div>
    </article>
  );
}

interface MiniCardProps {
  p: Product;
  onOpen?: (p: Product) => void;
}

export function MiniCard({ p, onOpen }: MiniCardProps) {
  return (
    <article className="mini" onClick={() => onOpen?.(p)} style={onOpen ? { cursor: 'pointer' } : undefined}>
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
