// app.jsx — ASUR storefront composition
// Sections: AnnouncementBar, Nav, Hero, Manifesto, FoundingThree, FullDrop, Lore, Calendar, Pact, Footer

const { useState, useEffect, useMemo } = React;

// ─── Brand data ──────────────────────────────────────────────────────────

const FOUNDING = [
  {
    n: '01', title: 'The Third Eye',
    spec: 'FRONT CHEST · DTF · BLACK TEE',
    desc: 'Anatomical eye + barbell plate. Sanskrit orbiting the iris.',
    price: 799,
    deva: 'त्रिनेत्र',
    label: 'CHEST · DTF',
    stampPosition: 'chest',
    bgVariant: 'rays',
    badge: 'NO RESTOCK',
    stock: 12,
  },
  {
    n: '02', title: 'Ravana Lifts',
    spec: 'FULL BACK · DTF · BLACK TEE',
    desc: 'Ten-headed Ravana in deadlift stance. Woodblock ink.',
    price: 899,
    deva: 'रावण',
    label: 'BACK · DTF',
    stampPosition: 'back',
    bgVariant: 'crosshatch',
    badge: 'FOUNDING THREE',
    stock: 7,
  },
  {
    n: '03', title: 'Just The Word',
    spec: 'CENTER CHEST · DTG · BLACK TEE',
    desc: 'ASUR in brutal condensed type. Distressed stamp. The restraint is the flex.',
    price: 749,
    deva: '',
    label: 'CHEST · DTG',
    stampPosition: 'word',
    bgVariant: 'sun',
    badge: 'NO RESTOCK',
    stock: 3,
  },
];

const FULL_DROP = [
  {
    n: '04', title: 'Vritra Rising',
    spec: 'FULL BACK · DTF · BLACK TEE',
    desc: 'Cosmic serpent-demon. Japanese woodblock meets dark mythology.',
    price: 1499,
    deva: 'वृत्र',
    label: 'BACK · GOLD TIER',
    stampPosition: 'back',
    bgVariant: 'storm',
    accent: 'var(--gold)',
    badge: 'GOLD TIER',
    badgeClass: 'gold',
    stock: 18,
  },
  {
    n: '05', title: 'Asur Script',
    spec: 'LEFT CHEST · DTG · BLACK TEE',
    desc: 'Devanagari in gestural brushstroke. Raw, handmade energy.',
    price: 699,
    deva: 'असुर',
    label: 'LEFT CHEST · DTG',
    stampPosition: 'left-chest',
    bgVariant: 'crosshatch',
    badge: 'CORE',
    stock: 24,
  },
  {
    n: '06', title: 'Not Good. Not Bad.',
    spec: 'FULL BACK · DTG · BLACK TEE',
    desc: 'Three-line manifesto in all-caps brutalist type. Typography is the design.',
    price: 849,
    deva: '',
    label: 'BACK · MANIFESTO',
    stampPosition: 'manifesto',
    bgVariant: 'sun',
    badge: 'CORE',
    stock: 31,
  },
];

const DROPS = [
  { date: '12.06', month: 'JUN', moon: '●', title: 'Vritra Rising', sub: 'Cosmic serpent · Gold tier · 50 pieces', tier: 'GOLD TIER', tierClass: 'gold', status: 'LIVE NOW', live: true },
  { date: '11.07', month: 'JUL', moon: '◐', title: 'Bhairava Fang', sub: 'Skull rosary · Fire accent · Core drop', tier: 'CORE', tierClass: '', status: '20 DAYS', live: false },
  { date: '09.08', month: 'AUG', moon: '○', title: 'Eclipse / Blood Drop', sub: 'Blood red · 24-hour window · 100 pieces', tier: 'BLOOD DROP', tierClass: 'blood', status: 'EMBER', live: false },
  { date: '08.09', month: 'SEP', moon: '◑', title: 'Tantra Stamp', sub: 'Devanagari brushwork · Limited run · Full moon', tier: 'CORE', tierClass: '', status: 'EMBER', live: false },
  { date: '07.10', month: 'OCT', moon: '●', title: 'Mahishasura Mardini', sub: 'Navratri exclusive · Blood drop · Never restocked', tier: 'BLOOD DROP', tierClass: 'blood', status: 'EMBER', live: false },
];

// ─── Sections ────────────────────────────────────────────────────────────

function AnnouncementBar({ status }) {
  // status can be 'live', 'ember', 'soldout'
  const items = {
    live: [
      'FOUNDING THREE · LIVE NOW',
      'NO RESTOCK · NO APOLOGY',
      'FULL MOON DROP · 12.06',
      'TRAIN LIKE AN ASUR · ANSWER TO NONE',
      'FREE SHIPPING OVER ₹1499',
      'BLOOD DROP · LOADING',
    ],
    ember: [
      'COUNTDOWN TO NEXT FULL MOON · 20 DAYS',
      'WAITLIST FOR BLOOD DROP NOW OPEN',
      'NEITHER DIVINE · NOR DAMNED',
      'WEAR WHAT YOU ARE',
      'GODS REST · ASUR DON\u2019T',
    ],
    soldout: [
      'FOUNDING THREE · SOLD OUT · NO RESTOCK',
      'NEXT DROP · FULL MOON · 11.07',
      'WAITLIST OPEN',
      'NEITHER DIVINE · NOR DAMNED',
    ],
  };
  const list = items[status] || items.live;
  const track = [...list, ...list];
  return (
    <div className="bar" role="status">
      <div className="bar-track">
        {track.map((t, i) => (
          <span key={i}>{t}<i>·</i></span>
        ))}
      </div>
    </div>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);

  // Lock body scroll when the drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const links = ['SHOP', 'DROPS', 'LORE', 'JOURNAL'];

  return (
    <nav className="nav">
      <div className="nav-row">
        <div className="nav-left">
          {links.map((l, i) => (
            <a href="#" className="nav-link" key={l}>{i === 0 && <span className="dot" />}{l}</a>
          ))}
        </div>
        <button
          className="nav-burger"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span /><span /><span />
        </button>
        <div className="brandmark">ASUR<sup>IN</sup></div>
        <div className="nav-right">
          <a href="#" className="nav-link">SEARCH</a>
          <a href="#" className="nav-link">ACCOUNT</a>
          <a href="#" className="cart-pill">CART <em>02</em></a>
        </div>
        <a href="#" className="nav-cart-mini" aria-label="Cart">
          <span className="cart-ct">2</span>
        </a>
      </div>

      {/* Mobile drawer */}
      <div className={`drawer ${open ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="drawer-top">
          <span className="brandmark" style={{ fontSize: 24 }}>ASUR<sup>IN</sup></span>
          <button className="drawer-x" aria-label="Close menu" onClick={() => setOpen(false)}>CLOSE ✕</button>
        </div>
        <div className="drawer-links">
          {links.map((l, i) => (
            <a href="#" key={l} onClick={() => setOpen(false)}>
              <em>{String(i + 1).padStart(2, '0')}</em>{l}<span className="ar">→</span>
            </a>
          ))}
        </div>
        <div className="drawer-foot">
          <div className="drawer-sub">
            <a href="#" onClick={() => setOpen(false)}>SEARCH</a>
            <a href="#" onClick={() => setOpen(false)}>ACCOUNT</a>
            <a href="#" onClick={() => setOpen(false)}>CART · 02</a>
          </div>
          <div className="deva" style={{ fontFamily: 'var(--f-deva)', fontSize: 22, color: 'var(--bone-q)', marginTop: 20 }}>असुर</div>
          <div className="mono" style={{ color: 'var(--bone-q)', marginTop: 8, letterSpacing: '0.18em' }}>NEITHER DIVINE · NOR DAMNED</div>
        </div>
      </div>
      {open && <div className="drawer-scrim" onClick={() => setOpen(false)} />}
    </nav>
  );
}

function Hero({ accent, status }) {
  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-left">
          <div>
            <div className="hero-tag-row">
              <span className="pill"><span className="pulse" />FOUNDING DROP · 03 PIECES</span>
              <span className="pill">EST. 2025 · MADE IN INDIA</span>
            </div>
            <h1 className="hero-h1">
              <span>NEITHER</span><br/>
              <span className="strike">DIVINE.</span><br/>
              <span className="line2">NOR DAMNED.</span>
            </h1>
          </div>
          <div className="hero-sub">
            <p>Clothing for those who refuse to be defined by someone else's moral code. Forged on black. One accent. Never restocked.</p>
            <a href="#" className="btn btn-fire">ENTER THE DROP <span className="arrow">→</span></a>
            <a href="#" className="btn btn-ghost">READ THE LORE</a>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-art">
            <HeroArt accent={accent} />
          </div>
          <dl className="hero-meta">
            <div>
              <dt>DROP</dt>
              <dd>FOUNDING<br/>THREE</dd>
            </div>
            <div>
              <dt>STATE</dt>
              <dd><em>{status === 'live' ? 'LIVE' : status === 'ember' ? 'EMBER' : 'SOLD'}</em></dd>
            </div>
            <div>
              <dt>PIECES</dt>
              <dd>22 / 50</dd>
            </div>
            <div>
              <dt>NEXT</dt>
              <dd>FULL MOON<br/>12.06</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section className="manifesto">
      <div className="side-l">
        <span className="eyebrow">/ 01</span>
        <span className="eyebrow eyebrow-bone">THE SOUL</span>
        <span className="mono" style={{ color: 'var(--bone-q)', marginTop: 24, lineHeight: 1.6 }}>
          ARCHETYPE<br/>
          <span style={{ color: 'var(--bone)' }}>REBEL WARRIOR</span><br/><br/>
          ENEMY<br/>
          <span style={{ color: 'var(--bone)' }}>MEDIOCRITY</span><br/><br/>
          FEELING<br/>
          <span style={{ color: 'var(--bone)' }}>YOU ANSWER<br/>TO NO ONE</span>
        </span>
      </div>
      <h2>
        TRAIN <span className="accent">LIKE</span> A DEMON.<br/>
        <span className="dim">BUILT FOR WAR,</span><br/>
        NOT WORSHIP.
      </h2>
      <div className="side-r" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
        <span className="eyebrow">DOCTRINE</span>
        <span className="mono" style={{ color: 'var(--bone-q)', marginTop: 24, lineHeight: 1.6 }}>
          BLACK IS ALWAYS BASE<br/>
          ONE ACCENT. ONE FLAME.<br/>
          NEVER WHITE. NEVER GREY.<br/><br/>
          NO RESTOCK.<br/>
          NO APOLOGY.<br/>
          NO DISCOUNT.
        </span>
      </div>
    </section>
  );
}

function ProductCard({ p, accent }) {
  const sold = p.stock === 0;
  return (
    <article className="card">
      <div className="card-media">
        <span className={`badge ${p.badgeClass || ''}`}>{p.badge}</span>
        <span className="index">{p.n}</span>
        <CardPlaceholder design={{ ...p, accent: p.accent || accent }} />
      </div>
      <div className="card-body">
        <div>
          <h4 className="card-title">{p.title}</h4>
          <div className="card-spec">{p.spec}</div>
          <div className="card-spec" style={{ color: 'var(--bone-d)', marginTop: 8, letterSpacing: '0.04em', fontFamily: 'var(--f-body)', textTransform: 'none', fontSize: 13 }}>{p.desc}</div>
          <div className="card-spec" style={{ marginTop: 14, color: p.stock < 10 ? 'var(--accent)' : 'var(--bone-q)' }}>
            {sold ? 'SOLD · NO RESTOCK' : `${p.stock} OF 50 LEFT`}
          </div>
        </div>
        <div className={`card-price ${sold ? 'sold' : ''}`}>
          ₹{p.price}
          <small>INCL. GST</small>
        </div>
      </div>
    </article>
  );
}

function FoundingThree({ accent }) {
  return (
    <section>
      <div className="section-head">
        <h3>FOUNDING<br/>THREE.</h3>
        <div></div>
        <div className="head-meta">
          <div>DROP 01 · LIVE NOW</div>
          <div><b>03 OF 03 RELEASED</b></div>
        </div>
      </div>
      <div className="products">
        {FOUNDING.map((p) => <ProductCard key={p.n} p={p} accent={accent} />)}
      </div>
    </section>
  );
}

function FullCatalogue({ accent }) {
  return (
    <section>
      <div className="divlabel">— THE FULL CATALOGUE</div>
      <div className="products">
        {FULL_DROP.map((p) => <ProductCard key={p.n} p={p} accent={accent} />)}
      </div>
    </section>
  );
}

function Lore({ accent }) {
  return (
    <section className="lore">
      <div className="lore-bg">
        <WoodblockField variant="storm" intensity={1.2} color="var(--bone-q)" />
      </div>
      <div className="lore-grid">
        <div>
          <span className="eyebrow eyebrow-fire" style={{ marginBottom: 32, display: 'block' }}>/ 02 — MYTHOLOGY</span>
          <h3>THEY CALLED US <em>DEMONS.</em><br/>WE CALLED IT <em>AMBITION.</em></h3>
          <p>In the oldest texts, the Asuras were the first beings. Powerful, unruly, refusing the gods' order. History recast them as demons because they refused to kneel.</p>
          <p>This brand is named after them. Not as costume. As inheritance. We don't make clothes to make you fit in. We make armour for people who never did.</p>
          <div style={{ display: 'flex', gap: 24, marginTop: 40, alignItems: 'center' }}>
            <a href="#" className="btn btn-fire">READ THE FULL LORE <span className="arrow">→</span></a>
            <span className="mono" style={{ color: 'var(--bone-q)' }}>06 CHAPTERS · 18 MIN READ</span>
          </div>
        </div>
        <div className="lore-side">
          <LoreArt accent={accent} />
        </div>
      </div>
    </section>
  );
}

function Calendar() {
  return (
    <section className="calendar">
      <div className="calendar-h">
        <h3>FULL MOON<br/>DROPS.</h3>
        <div className="head-meta" style={{ fontFamily: 'var(--f-mono)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--bone-d)', textTransform: 'uppercase', textAlign: 'right' }}>
          <div>ONE DROP · ONE MOON · ONE PHASE</div>
          <div style={{ color: 'var(--bone)' }}>NEVER RESTOCKED. NEVER NEGOTIATED.</div>
        </div>
      </div>
      <div className="calendar-list">
        {DROPS.map((d) => (
          <div className={`cal-row`} key={d.date}>
            <div className="date">{d.date}<small>{d.month} · 2026</small></div>
            <div className="moon" style={{ color: 'var(--bone-d)', fontSize: 28 }}>{d.moon}</div>
            <div className="title">{d.title}<small>{d.sub}</small></div>
            <div className={`tier ${d.tierClass}`}><span className="sw" />{d.tier}</div>
            <div className={`status ${d.live ? 'live' : ''}`}>{d.status}</div>
            <div className="chev">→</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pact() {
  return (
    <section className="pact">
      <div style={{ position: 'absolute', inset: 0, color: 'var(--accent)', opacity: 0.05, pointerEvents: 'none' }}>
        <WoodblockField variant="rays" intensity={1} color="currentColor" />
      </div>
      <div style={{ position: 'relative' }}>
        <span className="eyebrow eyebrow-fire" style={{ display: 'block', marginBottom: 24 }}>/ 03 — THE PACT</span>
        <h2 className="pact-h">JOIN THE <span className="accent">ORDER.</span></h2>
        <p>Be the first to know when the moon turns and a new drop releases. No spam. No discounts. Just the call when the next piece goes live.</p>
        <form className="pact-form" onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="EMAIL ADDRESS" />
          <button type="submit">TAKE THE OATH</button>
        </form>
        <div className="mono" style={{ marginTop: 28, color: 'var(--bone-q)' }}>
          2,847 ALREADY SWORN · NO RESTOCK · NO APOLOGY
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="foot">
        <div>
          <h5>ASUR · 2025</h5>
          <div className="foot-tagline">
            WEAR WHAT <span className="accent">YOU ARE.</span>
            <span className="deva">असुर · नैव दिव्यः · न प्रेतः</span>
          </div>
          <div className="mono" style={{ color: 'var(--bone-q)', letterSpacing: '0.18em' }}>@WEARASUR · ASUR.IN</div>
        </div>
        <div>
          <h5>SHOP</h5>
          <ul>
            <li><a href="#">Founding Three</a></li>
            <li><a href="#">All Tees</a></li>
            <li><a href="#">Gold Tier</a></li>
            <li><a href="#">Blood Drops</a></li>
            <li><a href="#">Sold Out Archive</a></li>
          </ul>
        </div>
        <div>
          <h5>THE BRAND</h5>
          <ul>
            <li><a href="#">The Lore</a></li>
            <li><a href="#">The Doctrine</a></li>
            <li><a href="#">Drop Calendar</a></li>
            <li><a href="#">Press</a></li>
          </ul>
        </div>
        <div>
          <h5>SUPPORT</h5>
          <ul>
            <li><a href="#">Shipping & Returns</a></li>
            <li><a href="#">Size Guide</a></li>
            <li><a href="#">Care Manual</a></li>
            <li><a href="#">Contact</a></li>
            <li><a href="#">FAQ</a></li>
          </ul>
        </div>
      </div>
      <div className="foot-bot">
        <div>© ASUR APPAREL · 2025 · MADE IN INDIA</div>
        <div className="center">NEITHER DIVINE · NOR DAMNED</div>
        <div className="right">TERMS · PRIVACY · IMPRESSUM</div>
      </div>
    </footer>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#D45A1A",
  "dropState": "live",
  "showDevanagari": true,
  "marquee": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply accent to CSS var
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', t.accent);
  }, [t.accent]);

  // Toggle marquee animation
  useEffect(() => {
    document.documentElement.style.setProperty('--marquee-play', t.marquee ? 'running' : 'paused');
    const track = document.querySelector('.bar-track');
    if (track) track.style.animationPlayState = t.marquee ? 'running' : 'paused';
  }, [t.marquee]);

  return (
    <>
      <PatternDefs />
      <AnnouncementBar status={t.dropState} />
      <Nav />
      <Hero accent={t.accent} status={t.dropState} />
      <Manifesto />
      <FoundingThree accent={t.accent} />
      <Lore accent={t.accent} />
      <FullCatalogue accent={t.accent} />
      <Calendar />
      <Pact />
      <Footer />

      <TweaksPanel>
        <TweakSection label="Brand accent" />
        <TweakColor
          label="Accent color"
          value={t.accent}
          options={['#D45A1A', '#8B1A1A', '#C4921A', '#E8E0D0']}
          onChange={(v) => setTweak('accent', v)}
        />
        <TweakSection label="Drop state" />
        <TweakRadio
          label="Status"
          value={t.dropState}
          options={[
            { value: 'live', label: 'Live' },
            { value: 'ember', label: 'Ember' },
            { value: 'soldout', label: 'Sold' },
          ]}
          onChange={(v) => setTweak('dropState', v)}
        />
        <TweakSection label="Motion" />
        <TweakToggle
          label="Marquee animation"
          value={t.marquee}
          onChange={(v) => setTweak('marquee', v)}
        />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
