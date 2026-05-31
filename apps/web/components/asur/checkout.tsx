'use client';

import { useState } from 'react';
import type { CartItem } from '@/lib/asur-catalog';
import { PAYMENT_METHODS, SAVED_ADDRESS } from '@/lib/asur-catalog';
import { CardPlaceholder } from './patterns';
import { Icon } from './icons';

const STEPS = ['ADDRESS', 'PAYMENT', 'DONE'];

function StepBar({ step }: { step: number }) {
  return (
    <div className="co-steps">
      {STEPS.map((s, i) => (
        <div key={s} className={`co-step ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}`}>
          <span className="co-step-n">{i < step ? <Icon name="check" /> : `0${i + 1}`}</span>
          <span className="co-step-l">{s}</span>
        </div>
      ))}
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  half?: boolean;
  type?: string;
}

function Field({ label, value, onChange, placeholder, half, type = 'text' }: FieldProps) {
  return (
    <label className={`co-field ${half ? 'half' : ''}`}>
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

interface AddrForm {
  name: string; phone: string; pin: string; line: string; city: string; state: string;
}

function AddressStep({ addr, setAddr, mode, setMode, onNext }: {
  addr: AddrForm; setAddr: (a: AddrForm) => void;
  mode: 'saved' | 'new'; setMode: (m: 'saved' | 'new') => void;
  onNext: () => void;
}) {
  const valid = mode === 'saved' ||
    (addr.name.trim() && addr.phone.trim() && addr.pin.trim().length >= 6 && addr.line.trim() && addr.city.trim());
  return (
    <div className="co-pane">
      <div className="co-sec-h">SHIP TO</div>

      <button className={`co-addr-card ${mode === 'saved' ? 'on' : ''}`} onClick={() => setMode('saved')}>
        <span className="co-radio" />
        <div className="co-addr-body">
          <div className="co-addr-top"><b>{SAVED_ADDRESS.name}</b><span className="co-tag">HOME</span></div>
          <div className="co-addr-line">{SAVED_ADDRESS.line}, {SAVED_ADDRESS.city}, {SAVED_ADDRESS.state} {SAVED_ADDRESS.pin}</div>
          <div className="co-addr-phone">{SAVED_ADDRESS.phone}</div>
        </div>
        <span className="co-addr-edit"><Icon name="edit" /></span>
      </button>

      <button className={`co-addr-card add ${mode === 'new' ? 'on' : ''}`} onClick={() => setMode('new')}>
        <span className="co-radio" />
        <div className="co-addr-body"><b>Ship to a new address</b></div>
        <span className="co-addr-edit"><Icon name="plus" /></span>
      </button>

      {mode === 'new' && (
        <div className="co-form">
          <Field label="FULL NAME" value={addr.name} onChange={(v) => setAddr({ ...addr, name: v })} placeholder="Your name" />
          <div className="co-form-row">
            <Field half label="PHONE" type="tel" value={addr.phone} onChange={(v) => setAddr({ ...addr, phone: v })} placeholder="+91" />
            <Field half label="PINCODE" value={addr.pin} onChange={(v) => setAddr({ ...addr, pin: v })} placeholder="400001" />
          </div>
          <Field label="ADDRESS" value={addr.line} onChange={(v) => setAddr({ ...addr, line: v })} placeholder="Flat, building, street, area" />
          <div className="co-form-row">
            <Field half label="CITY" value={addr.city} onChange={(v) => setAddr({ ...addr, city: v })} placeholder="City" />
            <Field half label="STATE" value={addr.state} onChange={(v) => setAddr({ ...addr, state: v })} placeholder="State" />
          </div>
        </div>
      )}

      <div className="co-eta">
        <Icon name="truck" />
        <span>Delivery to <b>{mode === 'saved' ? SAVED_ADDRESS.pin : (addr.pin || '——————')}</b> in <b>3–5 days</b> · dispatch within 48 hrs</span>
      </div>

      <button className={`co-cta ${!valid ? 'wait' : ''}`} disabled={!valid} onClick={onNext}>
        CONTINUE TO PAYMENT <Icon name="arrow" />
      </button>
    </div>
  );
}

function PaymentStep({ items, subtotal, pay, setPay, onBack, onPlace }: {
  items: CartItem[]; subtotal: number;
  pay: string; setPay: (p: string) => void;
  onBack: () => void; onPlace: (total: number) => void;
}) {
  const shipping = subtotal >= 1499 ? 0 : 79;
  const codFee = pay === 'cod' ? 50 : 0;
  const total = subtotal + shipping + codFee;
  return (
    <div className="co-pane">
      <div className="co-sec-h">ORDER · {items.length} {items.length === 1 ? 'PIECE' : 'PIECES'}</div>
      <div className="co-summary">
        {items.map((it) => (
          <div className="co-line" key={it.id + (it.size || '')}>
            <div className="co-line-media"><CardPlaceholder design={it} /></div>
            <div className="co-line-info">
              <div className="co-line-title">{it.deva && <span className="deva">{it.deva}</span>}{it.title}</div>
              <div className="co-line-meta">SIZE {it.size || 'M'} · QTY {it.qty}</div>
            </div>
            <div className="co-line-price">₹{it.price * it.qty}</div>
          </div>
        ))}
      </div>

      <div className="co-sec-h">PAYMENT METHOD</div>
      <div className="co-pays">
        {PAYMENT_METHODS.map((m) => (
          <button key={m.id} className={`co-pay ${pay === m.id ? 'on' : ''}`} onClick={() => setPay(m.id)}>
            <span className="co-radio" />
            <div className="co-pay-body">
              <div className="co-pay-top"><b>{m.label}</b>{m.tag && <span className="co-tag fire">{m.tag}</span>}</div>
              <div className="co-pay-sub">{m.sub}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="co-bill">
        <div className="co-bill-row"><span>Subtotal</span><span>₹{subtotal}</span></div>
        <div className="co-bill-row"><span>Shipping</span><span>{shipping === 0 ? <em>FREE</em> : `₹${shipping}`}</span></div>
        {codFee > 0 && <div className="co-bill-row"><span>COD handling</span><span>₹{codFee}</span></div>}
        <div className="co-bill-row total"><span>Total <i>incl GST</i></span><span>₹{total}</span></div>
      </div>

      <div className="co-secure"><Icon name="lock" /> Payments encrypted · No data stored on device</div>

      <div className="co-pay-actions">
        <button className="co-back" onClick={onBack}><Icon name="arrowL" /></button>
        <button className="co-cta" onClick={() => onPlace(total)}>PLACE ORDER · ₹{total}</button>
      </div>
    </div>
  );
}

function DoneStep({ orderId, total, items, eta, onClose }: {
  orderId: string; total: number; items: CartItem[]; eta: string; onClose: () => void;
}) {
  return (
    <div className="co-pane co-done">
      <div className="co-done-mark"><Icon name="check" /></div>
      <div className="co-done-deva">असुर</div>
      <h2 className="co-done-h">THE PACT<br />IS SEALED.</h2>
      <p className="co-done-p">Your claim is locked. No restock, no take-backs — just like we promised. A confirmation is on its way.</p>
      <div className="co-done-card">
        <div className="co-done-row"><span>ORDER</span><b>{orderId}</b></div>
        <div className="co-done-row"><span>PAID</span><b>₹{total}</b></div>
        <div className="co-done-row"><span>PIECES</span><b>{items.reduce((s, it) => s + it.qty, 0)}</b></div>
        <div className="co-done-row"><span>ARRIVES</span><b>{eta}</b></div>
      </div>
      <button className="co-cta" onClick={onClose}>BACK TO THE DROP <Icon name="arrow" /></button>
      <button className="co-done-track">TRACK ORDER</button>
    </div>
  );
}

interface CheckoutProps {
  items: CartItem[];
  onClose: () => void;
  onComplete?: () => void;
}

export function Checkout({ items, onClose, onComplete }: CheckoutProps) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'saved' | 'new'>('saved');
  const [addr, setAddr] = useState<AddrForm>({ name: '', phone: '', pin: '', line: '', city: '', state: '' });
  const [pay, setPay] = useState('upi');
  const [order, setOrder] = useState<{ id: string; total: number; eta: string } | null>(null);

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);

  const place = (total: number) => {
    const id = 'ASR-' + Math.floor(100000 + Math.random() * 899999);
    const d = new Date(Date.now() + 4 * 864e5);
    const eta = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    setOrder({ id, total, eta });
    setStep(2);
  };

  const finish = () => { onComplete?.(); onClose(); };

  return (
    <div className="co">
      <header className="pdp-top">
        <button className="s-ic" onClick={step === 1 ? () => setStep(0) : onClose} aria-label="Back">
          <Icon name="arrowL" />
        </button>
        <div className="pdp-top-mid">{step === 2 ? 'CONFIRMED' : 'CHECKOUT'}</div>
        <div className="pdp-top-right" style={{ width: 40 }} />
      </header>

      {step < 2 && <StepBar step={step} />}

      <div className="co-scroll">
        {step === 0 && (
          <AddressStep addr={addr} setAddr={setAddr} mode={mode} setMode={setMode} onNext={() => setStep(1)} />
        )}
        {step === 1 && (
          <PaymentStep items={items} subtotal={subtotal} pay={pay} setPay={setPay}
                       onBack={() => setStep(0)} onPlace={place} />
        )}
        {step === 2 && order && (
          <DoneStep orderId={order.id} total={order.total} items={items} eta={order.eta} onClose={finish} />
        )}
      </div>
    </div>
  );
}
