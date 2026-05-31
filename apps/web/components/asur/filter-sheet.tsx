'use client';

import { Icon } from './icons';
import { FILTER_TIERS, FILTER_FITS, PRICE_BOUNDS, EMPTY_FILTERS } from '@/lib/asur-catalog';
import type { Filters } from '@/lib/asur-catalog';

function PriceRange({ value, onChange }: { value: [number, number]; onChange: (v: [number, number]) => void }) {
  const { min, max, step } = PRICE_BOUNDS;
  const [lo, hi] = value;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const setLo = (v: number) => onChange([Math.min(v, hi - step), hi]);
  const setHi = (v: number) => onChange([lo, Math.max(v, lo + step)]);
  return (
    <div className="frange">
      <div className="frange-track">
        <div className="frange-fill" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input type="range" min={min} max={max} step={step} value={lo}
               onChange={(e) => setLo(Number(e.target.value))} aria-label="Minimum price" />
        <input type="range" min={min} max={max} step={step} value={hi}
               onChange={(e) => setHi(Number(e.target.value))} aria-label="Maximum price" />
      </div>
      <div className="frange-vals">
        <span>₹{lo}</span>
        <span className="dash">—</span>
        <span>₹{hi}{hi >= max ? '+' : ''}</span>
      </div>
    </div>
  );
}

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  value: Filters;
  onChange: (f: Filters) => void;
  resultCount: number;
}

export function FilterSheet({ open, onClose, value, onChange, resultCount }: FilterSheetProps) {
  const f = value;
  const toggleIn = (key: 'tiers' | 'fits', id: string) => {
    const cur = f[key];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    onChange({ ...f, [key]: next });
  };
  const active = (f.tiers.length + f.fits.length) +
    (f.price[0] > PRICE_BOUNDS.min || f.price[1] < PRICE_BOUNDS.max ? 1 : 0) +
    (f.inStock ? 1 : 0);

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
          <div className="fgroup">
            <div className="fgroup-h">TIER</div>
            <div className="fchips">
              {FILTER_TIERS.map((t) => (
                <button key={t.id} className={`fchip ${f.tiers.includes(t.id) ? 'on' : ''}`}
                        onClick={() => toggleIn('tiers', t.id)}>
                  <span className="sw" style={{ background: t.sw }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="fgroup">
            <div className="fgroup-h">PRICE <span className="fgroup-note">INCL GST</span></div>
            <PriceRange value={f.price} onChange={(p) => onChange({ ...f, price: p })} />
          </div>

          <div className="fgroup">
            <div className="fgroup-h">FIT</div>
            <div className="fseg">
              {FILTER_FITS.map((fit) => (
                <button key={fit.id} className={`fseg-b ${f.fits.includes(fit.id) ? 'on' : ''}`}
                        onClick={() => toggleIn('fits', fit.id)}>
                  {fit.label}
                </button>
              ))}
            </div>
          </div>

          <div className="fgroup">
            <div className="fgroup-h">AVAILABILITY</div>
            <button className={`frow ${f.inStock ? 'on' : ''}`} onClick={() => onChange({ ...f, inStock: !f.inStock })}>
              <span>In stock only</span>
              <span className="fswitch"><i /></span>
            </button>
          </div>
        </div>

        <div className="fsheet-foot">
          <button className="fsheet-clear"
                  onClick={() => onChange({ ...EMPTY_FILTERS, price: [PRICE_BOUNDS.min, PRICE_BOUNDS.max] })}>
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
