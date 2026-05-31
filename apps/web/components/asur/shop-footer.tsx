'use client';

import { useState } from 'react';
import { FOOT_SOCIAL, FOOT_ACCORDIONS } from '@/lib/asur-catalog';
import { Icon } from './icons';

function Accordion({ label, items }: { label: string; items: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`acc ${open ? 'open' : ''}`}>
      <button className="acc-head" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>{label}</span>
        <Icon name={open ? 'minus' : 'plus'} className="acc-ic" />
      </button>
      <div className="acc-body" style={{ maxHeight: open ? items.length * 44 + 8 : 0 }}>
        {items.map((it) => <a href="#" key={it}>{it}</a>)}
      </div>
    </div>
  );
}

export function ShopFooter() {
  const [done, setDone] = useState(false);
  return (
    <footer className="s-foot">
      <div className="s-news">
        <div className="s-news-kicker">/ JOIN THE ORDER</div>
        <h2 className="s-news-h">SWORN TO <em>ASUR.</em></h2>
        <p>The call goes out when the moon turns. No spam. No discounts. Just the drop.</p>
        <form className="s-news-form" onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
          <input type="email" placeholder="EMAIL ADDRESS" required />
          <button type="submit">{done ? 'SWORN ✓' : 'TAKE THE OATH'}</button>
        </form>
        <div className="s-news-count">2,847 ALREADY SWORN</div>
      </div>

      <div className="s-social-wrap">
        <div className="s-social-h">SPOT US ON</div>
        <div className="s-social">
          {FOOT_SOCIAL.map((s) => (
            <a href="#" className="s-social-cell" key={s.label}>
              <span className="s-social-ic"><Icon name={s.icon} /></span>
              <span className="s-social-tx"><b>{s.label}</b><i>{s.handle}</i></span>
            </a>
          ))}
        </div>
      </div>

      <div className="s-accordions">
        {FOOT_ACCORDIONS.map((a) => <Accordion key={a.label} label={a.label} items={a.items} />)}
      </div>

      <div className="s-legal">
        <div className="s-legal-row">
          <span>© ASUR APPAREL · 2026</span>
          <span>MADE IN INDIA</span>
        </div>
        <div className="s-legal-links">
          <a href="#">TERMS</a><a href="#">PRIVACY</a><a href="#">SHIPPING</a>
        </div>
      </div>

      <div className="s-watermark" aria-hidden="true">
        ASUR<span className="deva">असुर</span>
      </div>
    </footer>
  );
}
