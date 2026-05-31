// patterns.jsx — woodblock-y placeholder system for ASUR
// Intentional patterns (hatching, halftone, scan-lines, t-shirt silhouette + stamped chest box).
// Each "placeholder" renders a textured panel with a monospace caption strip so it's
// obviously a slot for real art, not pretending to be art.

const PatternDefs = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
    <defs>
      {/* diagonal hatching, woodblock ink feel */}
      <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="1.5" />
      </pattern>
      <pattern id="hatch-fine" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" strokeWidth="0.6" />
      </pattern>
      <pattern id="hatch-cross" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(30)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="0.6" />
        <line x1="0" y1="0" x2="8" y2="0" stroke="currentColor" strokeWidth="0.6" />
      </pattern>
      {/* halftone dots, increasing density */}
      <pattern id="dots-lg" patternUnits="userSpaceOnUse" width="10" height="10">
        <circle cx="5" cy="5" r="1.4" fill="currentColor" />
      </pattern>
      <pattern id="dots-md" patternUnits="userSpaceOnUse" width="8" height="8">
        <circle cx="4" cy="4" r="0.9" fill="currentColor" />
      </pattern>
      <pattern id="dots-sm" patternUnits="userSpaceOnUse" width="6" height="6">
        <circle cx="3" cy="3" r="0.55" fill="currentColor" />
      </pattern>
      <pattern id="scanlines" patternUnits="userSpaceOnUse" width="3" height="3">
        <line x1="0" y1="0" x2="3" y2="0" stroke="currentColor" strokeWidth="0.4" />
      </pattern>
      {/* radial gradient masks — center bright, edges dark, like a sun behind ink */}
      <radialGradient id="ink-sun" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" />
        <stop offset="55%" stopColor="currentColor" stopOpacity="0.35" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

// A "stamped" tee silhouette — using rectangles and a rounded neck only.
// Stays within the "no complex SVG" rule: it's geometric, not figurative.
function TeeFrame({ accent = 'var(--accent)', fill = 'var(--ash-2)' }) {
  return (
    <svg viewBox="0 0 600 720" preserveAspectRatio="xMidYMid meet"
         style={{ width: '88%', maxWidth: 520, color: 'var(--bone-q)' }}
         aria-hidden="true">
      {/* tee body: body rect + sleeves as rects + neck cut as small rect */}
      <g>
        {/* sleeves */}
        <rect x="40" y="105" width="115" height="170" fill={fill} />
        <rect x="445" y="105" width="115" height="170" fill={fill} />
        {/* shoulders cut */}
        <polygon points="155,105 245,90 355,90 445,105 445,140 155,140" fill={fill} />
        {/* body */}
        <rect x="155" y="140" width="290" height="500" fill={fill} />
        {/* neck */}
        <rect x="260" y="90" width="80" height="22" fill="var(--void)" />
        {/* outline */}
        <g fill="none" stroke="var(--hair-2)" strokeWidth="1">
          <rect x="40" y="105" width="115" height="170" />
          <rect x="445" y="105" width="115" height="170" />
          <rect x="155" y="140" width="290" height="500" />
          <polygon points="155,105 245,90 355,90 445,105 445,140 155,140" />
        </g>
      </g>
    </svg>
  );
}

// Stamped chest box: an empty square framed by a Devanagari label.
// This is where the print "is" — we don't draw the actual art.
function ChestStamp({ label = 'CHEST · ASUR', deva = 'असुर', size = 180, top = 220, accent = 'var(--accent)' }) {
  return (
    <div style={{
      position: 'absolute',
      top, left: '50%',
      transform: 'translateX(-50%)',
      width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'currentColor', opacity: 0.04,
        color: 'var(--bone)',
      }} />
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ position: 'absolute', inset: 0, color: 'var(--bone-q)' }}>
        <rect x="0.5" y="0.5" width={size - 1} height={size - 1}
              fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
        {/* halftone fill, biased toward center via mask */}
        <rect x="0" y="0" width={size} height={size} fill="url(#dots-md)" style={{ color: 'var(--bone-q)' }} opacity="0.35" />
      </svg>
      <div style={{ position: 'relative', textAlign: 'center', color: 'var(--bone-d)' }}>
        <div style={{ fontFamily: 'var(--f-deva)', fontSize: size * 0.36, lineHeight: 0.9, color: accent }}>{deva}</div>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 8, color: 'var(--bone-q)' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// Full-back stamp: bigger, sits centered.
function BackStamp({ label = 'FULL BACK · DTF', deva = 'रावण', accent = 'var(--accent)' }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'relative',
        width: '46%', aspectRatio: '3 / 4',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: 'var(--bone-d)',
      }}>
        <svg viewBox="0 0 200 260" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', color: 'var(--bone-q)' }}>
          <rect x="0.5" y="0.5" width="199" height="259" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
          <rect width="200" height="260" fill="url(#dots-sm)" opacity="0.4" />
        </svg>
        <div style={{ fontFamily: 'var(--f-deva)', fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 0.9, color: accent, position: 'relative' }}>{deva}</div>
        <div style={{
          fontFamily: 'var(--f-mono)', fontSize: 9, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: 'var(--bone-q)',
          position: 'relative', marginTop: 10, textAlign: 'center', maxWidth: '80%',
        }}>{label}</div>
      </div>
    </div>
  );
}

// Background woodblock pattern panel — used inside lore section + hero left.
// It's a composition of geometric hatching layers — not a figurative drawing.
function WoodblockField({ variant = 'sun', intensity = 1, color = 'var(--bone-q)' }) {
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice"
         style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', color }}
         aria-hidden="true">
      {variant === 'sun' && (
        <>
          {/* concentric rays as rectangles */}
          <g style={{ transformOrigin: '400px 600px' }}>
            {[...Array(24)].map((_, i) => (
              <rect key={i}
                    x="398" y="0" width="4" height="600"
                    fill="currentColor" opacity={0.25 * intensity}
                    transform={`rotate(${(i / 24) * 360} 400 600)`} />
            ))}
          </g>
          <circle cx="400" cy="600" r="220" fill="url(#hatch)" opacity={0.6 * intensity} />
          <circle cx="400" cy="600" r="160" fill="url(#dots-md)" opacity={0.8 * intensity} />
        </>
      )}
      {variant === 'storm' && (
        <>
          <rect width="800" height="600" fill="url(#scanlines)" opacity={0.5 * intensity} />
          <rect width="800" height="200" fill="url(#hatch-fine)" opacity={0.7 * intensity} />
          <rect y="380" width="800" height="220" fill="url(#hatch)" opacity={0.4 * intensity} />
        </>
      )}
      {variant === 'crosshatch' && (
        <rect width="800" height="600" fill="url(#hatch-cross)" opacity={0.7 * intensity} />
      )}
      {variant === 'rays' && (
        <g style={{ transformOrigin: '400px 300px' }}>
          {[...Array(36)].map((_, i) => (
            <polygon key={i}
                     points="396,300 404,300 410,-200 390,-200"
                     fill="currentColor" opacity={(i % 2 ? 0.25 : 0.12) * intensity}
                     transform={`rotate(${(i / 36) * 360} 400 300)`} />
          ))}
        </g>
      )}
    </svg>
  );
}

// CardPlaceholder — composes a tee silhouette with a stamp inside an ash card.
// Variant decides the woodblock backing + stamp position + caption.
function CardPlaceholder({ design, index }) {
  const { stampPosition, deva, label, bgVariant, accent, soldOut } = design;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* woodblock backing — very subtle */}
      <div style={{ position: 'absolute', inset: 0, color: 'var(--bone-q)', opacity: 0.18 }}>
        <WoodblockField variant={bgVariant} intensity={0.7} />
      </div>
      {/* corner ticks */}
      <CornerTicks />
      {/* tee silhouette + stamp */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '78%', maxWidth: 480, aspectRatio: '5 / 6' }}>
          <TeeFrame />
          {stampPosition === 'chest' && <ChestStamp label={label} deva={deva} size={140} top="34%" accent={accent || 'var(--accent)'} />}
          {stampPosition === 'left-chest' && (
            <div style={{ position: 'absolute', top: '32%', left: '34%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--f-deva)', fontSize: 22, color: accent || 'var(--accent)', lineHeight: 1 }}>{deva}</div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 7, letterSpacing: '0.18em', color: 'var(--bone-q)', marginTop: 3 }}>{label}</div>
            </div>
          )}
          {stampPosition === 'back' && <BackStamp label={label} deva={deva} accent={accent || 'var(--accent)'} />}
          {stampPosition === 'word' && (
            <div style={{ position: 'absolute', top: '36%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(32px, 5vw, 52px)', color: 'var(--bone-d)', letterSpacing: '0.04em', lineHeight: 1 }}>ASUR</div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 8, letterSpacing: '0.16em', color: 'var(--bone-q)', marginTop: 8 }}>{label}</div>
            </div>
          )}
          {stampPosition === 'manifesto' && (
            <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '70%' }}>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(16px, 2.4vw, 26px)', color: 'var(--bone-d)', letterSpacing: '0.02em', lineHeight: 1.05 }}>
                NOT GOOD<br/>NOT BAD<br/><span style={{ color: accent || 'var(--accent)' }}>NECESSARY</span>
              </div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 7, letterSpacing: '0.18em', color: 'var(--bone-q)', marginTop: 12 }}>{label}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CornerTicks({ color = 'var(--hair-2)', size = 12 }) {
  const tick = { position: 'absolute', width: size, height: size, borderColor: color, borderStyle: 'solid', borderWidth: 0 };
  return (
    <>
      <span style={{ ...tick, top: 14, left: 14, borderTopWidth: 1, borderLeftWidth: 1 }} />
      <span style={{ ...tick, top: 14, right: 14, borderTopWidth: 1, borderRightWidth: 1 }} />
      <span style={{ ...tick, bottom: 14, left: 14, borderBottomWidth: 1, borderLeftWidth: 1 }} />
      <span style={{ ...tick, bottom: 14, right: 14, borderBottomWidth: 1, borderRightWidth: 1 }} />
    </>
  );
}

// Hero art panel — big stamped tee with woodblock sun + meta strip.
function HeroArt({ accent }) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', inset: 0, color: 'var(--bone-q)', opacity: 0.30 }}>
        <WoodblockField variant="rays" intensity={1} />
      </div>
      <CornerTicks />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '76%', maxWidth: 540, aspectRatio: '5 / 6' }}>
          <TeeFrame />
          <BackStamp label="FOUNDING DROP · 01" deva="असुर" accent={accent || 'var(--accent)'} />
        </div>
      </div>
      <div className="holder-cap">
        <span><b>RAVANA LIFTS</b> · FULL BACK · DTF · BLACK TEE</span>
        <span>FRONT VIEW · MOCKUP</span>
      </div>
    </div>
  );
}

// Lore panel — used as the side image in the mythology section
function LoreArt({ accent }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, color: 'var(--accent)', opacity: 0.25 }}>
        <WoodblockField variant="sun" intensity={1.2} color="currentColor" />
      </div>
      <CornerTicks color="var(--hair-2)" />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '8%',
      }}>
        <div style={{ fontFamily: 'var(--f-deva)', fontSize: 'clamp(72px, 12vw, 160px)', color: 'var(--bone)', lineHeight: 0.9 }}>असुर</div>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.24em', color: 'var(--bone-q)', marginTop: 24, textTransform: 'uppercase' }}>
          ASURA · / əˈsʊrə /
        </div>
        <div style={{ fontFamily: 'var(--f-body)', fontSize: 13, color: 'var(--bone-d)', marginTop: 14, maxWidth: '24ch', lineHeight: 1.4 }}>
          Sanskrit. Those who refused the gods. Not evil. Not good. Necessary.
        </div>
      </div>
      <div className="holder-cap">
        <span><b>LORE PANEL</b> · WOODBLOCK FIELD</span>
        <span>MYTHOLOGY · 01</span>
      </div>
    </div>
  );
}

// Expose to other Babel scripts via window
Object.assign(window, {
  PatternDefs,
  TeeFrame,
  ChestStamp,
  BackStamp,
  WoodblockField,
  CardPlaceholder,
  CornerTicks,
  HeroArt,
  LoreArt,
});
