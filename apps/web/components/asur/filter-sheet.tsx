"use client";

import { PRICE_BOUNDS } from "@/lib/filter-params";
import type { ProductFilters } from "@/lib/filter-params";

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  value: ProductFilters;
  onChange: (f: ProductFilters) => void;
  resultCount: number;
  categories: string[];
  sizes: string[];
  colors: string[];
}

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
        <span>₹{lo.toLocaleString("en-IN")}</span>
        <span className="dash">—</span>
        <span>₹{hi.toLocaleString("en-IN")}{hi >= max ? "+" : ""}</span>
      </div>
    </div>
  );
}

const FIT_OPTIONS = [
  { id: "regular", label: "Regular" },
  { id: "oversized", label: "Oversized" },
  { id: "boxy", label: "Boxy" },
  { id: "relaxed", label: "Relaxed" },
];

function countActive(f: ProductFilters): number {
  let n = 0;
  if (f.q) n++;
  if (f.category) n++;
  if (f.fit) n++;
  if (f.size) n++;
  if (f.color) n++;
  if (f.inStock) n++;
  if (f.sort !== "newest") n++;
  if (f.minPrice > PRICE_BOUNDS.min || f.maxPrice < PRICE_BOUNDS.max) n++;
  return n;
}

export function FilterSheet({ open, onClose, value: f, onChange, resultCount, categories, sizes, colors }: FilterSheetProps) {
  const active = countActive(f);
  const priceChanged = f.minPrice > PRICE_BOUNDS.min || f.maxPrice < PRICE_BOUNDS.max;

  function clearAll() {
    onChange({ q: f.q, category: "", fit: "", size: "", color: "", minPrice: PRICE_BOUNDS.min, maxPrice: PRICE_BOUNDS.max, inStock: false, sort: "newest" });
  }

  return (
    <>
      {open && <div className="drw-scrim" onClick={onClose} />}
      <aside className={`fsheet ${open ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="Filters">
        <div className="fsheet-grab" />
        <div className="fsheet-head">
          <div className="fsheet-title">FILTERS {active > 0 && <em>· {active}</em>}</div>
          <button className="drw-x" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="fsheet-body">
          {/* Category */}
          {categories.length > 0 && (
            <div className="fgroup">
              <div className="fgroup-h">CATEGORY</div>
              <div className="fchips">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`fchip ${f.category === cat ? "on" : ""}`}
                    onClick={() => onChange({ ...f, category: f.category === cat ? "" : cat })}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fit */}
          <div className="fgroup">
            <div className="fgroup-h">FIT</div>
            <div className="fseg">
              {FIT_OPTIONS.map((fit) => (
                <button
                  key={fit.id}
                  className={`fseg-b ${f.fit === fit.id ? "on" : ""}`}
                  onClick={() => onChange({ ...f, fit: f.fit === fit.id ? "" : fit.id })}
                >
                  {fit.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          {sizes.length > 0 && (
            <div className="fgroup">
              <div className="fgroup-h">SIZE</div>
              <div className="fchips">
                {sizes.map((s) => (
                  <button
                    key={s}
                    className={`fchip ${f.size === s ? "on" : ""}`}
                    onClick={() => onChange({ ...f, size: f.size === s ? "" : s })}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color */}
          {colors.length > 0 && (
            <div className="fgroup">
              <div className="fgroup-h">COLOR</div>
              <div className="fchips">
                {colors.map((c) => (
                  <button
                    key={c}
                    className={`fchip ${f.color === c ? "on" : ""}`}
                    onClick={() => onChange({ ...f, color: f.color === c ? "" : c })}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="fgroup">
            <div className="fgroup-h">PRICE <span className="fgroup-note">INCL. GST</span></div>
            <PriceRange
              value={[f.minPrice, f.maxPrice]}
              onChange={([lo, hi]) => onChange({ ...f, minPrice: lo, maxPrice: hi })}
            />
          </div>

          {/* In Stock */}
          <div className="fgroup">
            <div className="fgroup-h">AVAILABILITY</div>
            <button className={`frow ${f.inStock ? "on" : ""}`} onClick={() => onChange({ ...f, inStock: !f.inStock })}>
              <span>In stock only</span>
              <span className="fswitch"><i /></span>
            </button>
          </div>
        </div>

        <div className="fsheet-foot">
          <button className="fsheet-clear" onClick={clearAll}>
            CLEAR ALL
          </button>
          <button className="fsheet-apply" onClick={onClose}>
            SHOW {resultCount} {resultCount === 1 ? "PIECE" : "PIECES"}
          </button>
        </div>
      </aside>
    </>
  );
}
