// shop-data.jsx — ASUR catalogue + nav/footer data
// Pricing follows ASUR doctrine: single price, NO discounts. Scarcity is the lever.

const SHOP_PRODUCTS = [
  { id: 'p1', n: '01', title: 'Acid-Washed Third Eye Tee', deva: 'त्रिनेत्र',
    price: 799, rating: 5.0, reviews: 42, stock: 7, cap: 50,
    badge: 'NO RESTOCK', badgeClass: 'fire', tier: 'CORE', fit: 'REGULAR',
    stampPosition: 'chest', bgVariant: 'rays', accent: 'var(--accent)' },

  { id: 'p2', n: '02', title: 'Ravana Lifts Oversized Back-Print', deva: 'रावण',
    price: 899, rating: 5.0, reviews: 28, stock: 12, cap: 50,
    badge: 'FOUNDING', badgeClass: '', tier: 'FOUNDING', fit: 'OVERSIZED',
    stampPosition: 'back', bgVariant: 'crosshatch', accent: 'var(--accent)' },

  { id: 'p3', n: '03', title: 'Just The Word — Distressed Stamp Tee', deva: '',
    price: 749, rating: 4.9, reviews: 64, stock: 3, cap: 50,
    badge: 'NO RESTOCK', badgeClass: 'fire', tier: 'CORE', fit: 'REGULAR',
    stampPosition: 'word', bgVariant: 'sun', accent: 'var(--accent)' },

  { id: 'p4', n: '04', title: 'Vritra Rising — Gold Tier Heavyweight', deva: 'वृत्र',
    price: 1499, rating: 5.0, reviews: 9, stock: 18, cap: 50,
    badge: 'GOLD TIER', badgeClass: 'gold', tier: 'GOLD', fit: 'OVERSIZED',
    stampPosition: 'back', bgVariant: 'storm', accent: 'var(--gold)' },

  { id: 'p5', n: '05', title: 'Asur Devanagari Brushstroke Tee', deva: 'असुर',
    price: 699, rating: 4.8, reviews: 51, stock: 24, cap: 50,
    badge: 'CORE', badgeClass: '', tier: 'CORE', fit: 'REGULAR',
    stampPosition: 'left-chest', bgVariant: 'crosshatch', accent: 'var(--accent)' },

  { id: 'p6', n: '06', title: 'Not Good. Not Bad. Manifesto Back-Print', deva: '',
    price: 849, rating: 4.9, reviews: 33, stock: 31, cap: 50,
    badge: 'CORE', badgeClass: '', tier: 'CORE', fit: 'OVERSIZED',
    stampPosition: 'manifesto', bgVariant: 'sun', accent: 'var(--accent)' },

  { id: 'p7', n: '07', title: 'Bhairava Fang — Skull Rosary Tee', deva: 'भैरव',
    price: 899, rating: 4.7, reviews: 12, stock: 2, cap: 40,
    badge: 'LOW STOCK', badgeClass: 'fire', tier: 'CORE', fit: 'REGULAR',
    stampPosition: 'chest', bgVariant: 'sun', accent: 'var(--accent)' },

  { id: 'p8', n: '08', title: 'Eclipse Blood Drop — Limited 100', deva: 'ग्रहण',
    price: 1299, rating: 5.0, reviews: 6, stock: 9, cap: 100,
    badge: 'BLOOD DROP', badgeClass: 'blood', tier: 'BLOOD', fit: 'OVERSIZED',
    stampPosition: 'back', bgVariant: 'storm', accent: 'var(--blood)' },
];

// ── filter taxonomy ──────────────────────────────────────────────────
const FILTER_TIERS = [
  { id: 'FOUNDING', label: 'Founding Three', sw: 'var(--accent)' },
  { id: 'CORE',     label: 'Core',          sw: 'var(--bone-d)' },
  { id: 'GOLD',     label: 'Gold Tier',     sw: 'var(--gold)' },
  { id: 'BLOOD',    label: 'Blood Drop',    sw: 'var(--blood)' },
];
const FILTER_FITS = [
  { id: 'OVERSIZED', label: 'Oversized' },
  { id: 'REGULAR',   label: 'Regular' },
];
const PRICE_BOUNDS = { min: 600, max: 1600, step: 50 };

// ── per-product PDP detail (lore + fabric + size run) ────────────────
// Sizes flagged sold-out add scarcity texture. Size run mirrors stock.
const SIZE_RUN = ['S', 'M', 'L', 'XL', 'XXL'];

const PDP_BOOK = {
  p1: {
    sub: 'The eye that opens inward burns what it sees.',
    lore: 'Shiva\u2019s third eye does not weep \u2014 it incinerates. We bleached this one by hand so the त्रिनेत्र surfaces like a scar through acid, never twice the same. Each wash map is unique; the tee you claim is the only one of its kind.',
    gsm: '190', cut: 'Regular drop-shoulder', print: 'Acid wash + plastisol',
    soldSizes: ['XXL'] },
  p2: {
    sub: 'Ten heads. Ten kinds of knowing. Zero apology.',
    lore: 'They wrote him the villain. He was the scholar-king who lifted Kailash to test the mountain\u2019s god. रावण across the full back, ink-heavy, built to outlast the story they told about him.',
    gsm: '240', cut: 'Oversized boxy', print: 'Full-back DTF',
    soldSizes: [] },
  p3: {
    sub: 'No deity. No drawing. Just the word, stamped raw.',
    lore: 'Stripped to the signature. ASUR distressed like a press that ran out of ink halfway and kept going anyway. The most honest piece in the line \u2014 it argues nothing.',
    gsm: '190', cut: 'Regular', print: 'Distressed stamp',
    soldSizes: ['S'] },
  p4: {
    sub: 'The serpent that swallowed the rivers, rising again.',
    lore: 'वृत्र coiled around the waters until Indra split him open. Heavyweight, gold-stamped, the tier reserved for the pieces we only make once a season. This is the heaviest cloth we cut.',
    gsm: '260', cut: 'Oversized heavyweight', print: 'Gold foil DTF',
    soldSizes: [] },
  p5: {
    sub: 'The name, brushed in one breath.',
    lore: 'A single असुर laid down wet-on-wet, the brush never lifting. The founding mark of the house, sized small over the heart. Quiet on purpose.',
    gsm: '190', cut: 'Regular', print: 'Left-chest brushwork',
    soldSizes: [] },
  p6: {
    sub: 'Not good. Not bad. Necessary.',
    lore: 'The whole doctrine, printed across the spine. The asuras were never the evil ones \u2014 they were the friction the universe needed to keep moving. Wear the argument.',
    gsm: '240', cut: 'Oversized boxy', print: 'Full-back DTF',
    soldSizes: ['M'] },
  p7: {
    sub: 'The fang that guards the cremation ground.',
    lore: 'भैरव wears a rosary of skulls and answers to no court of heaven. Chest-stamped, low run \u2014 two left at last count. When it\u2019s gone the plate gets destroyed.',
    gsm: '190', cut: 'Regular', print: 'Chest plastisol',
    soldSizes: ['L', 'XL'] },
  p8: {
    sub: 'A hundred shirts. One eclipse. Then dark.',
    lore: 'ग्रहण \u2014 the swallowing of the sun. Numbered to one hundred, each with a single blood drop printed at the hem. When the moon clears, the drop is closed forever.',
    gsm: '240', cut: 'Oversized heavyweight', print: 'Blood-red DTF + number',
    soldSizes: ['XXL'] },
};

// PDP gallery: each product reads as 4 framed angles built from the placeholder system
const GALLERY_ANGLES = [
  { key: 'front', label: 'FRONT' },
  { key: 'back',  label: 'BACK' },
  { key: 'detail', label: 'DETAIL' },
  { key: 'onbody', label: 'ON-BODY' },
];

// ── checkout ─────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'upi',  label: 'UPI', sub: 'GPay · PhonePe · Paytm', tag: 'INSTANT' },
  { id: 'card', label: 'Card', sub: 'Credit / Debit · Visa · RuPay', tag: '' },
  { id: 'netbank', label: 'Netbanking', sub: 'All major banks', tag: '' },
  { id: 'cod',  label: 'Cash on Delivery', sub: '\u20b950 handling fee', tag: '' },
];
const SAVED_ADDRESS = {
  name: 'Kabir Anand', phone: '+91 98••• ••210',
  line: '14, Off Carter Road, Bandra West', city: 'Mumbai', state: 'Maharashtra', pin: '400050',
};

const SHOP_CHIPS = ['ALL', 'FOUNDING', 'CORE', 'GOLD TIER', 'BLOOD DROP', 'OVERSIZED', 'BACK-PRINT'];

const NAV_CATEGORIES = [
  { label: 'FOUNDING THREE', arrow: true },
  { label: 'FULL MOON DROPS', arrow: true },
  { label: 'GOLD TIER', arrow: false },
  { label: 'BLOOD DROPS', arrow: false },
  { label: 'BACK-PRINT TEES', arrow: true },
  { label: 'OVERSIZED FITS', arrow: true },
  { label: 'THE LORE', arrow: false },
  { label: 'ALL PRODUCTS', arrow: true },
  { label: 'SOLD-OUT ARCHIVE', arrow: false },
];

const NAV_ACCOUNT = [
  { label: 'MY ACCOUNT', full: true },
  { label: 'SUPPORT' },
  { label: 'MY ORDERS' },
  { label: 'RETURN / EXCHANGE', full: true },
];

const RECENTLY_VIEWED = [
  { id: 'r1', title: 'Mahishasura Mardini Tee', deva: 'महिष', price: 1199, rating: 4.6, reviews: 55, stampPosition: 'back', bgVariant: 'crosshatch' },
  { id: 'r2', title: 'Tantra Stamp Brushwork Tee', deva: 'तंत्र', price: 799, rating: 4.8, reviews: 21, stampPosition: 'left-chest', bgVariant: 'sun' },
  { id: 'r3', title: 'Agni Flame Back-Print', deva: 'अग्नि', price: 999, rating: 4.9, reviews: 18, stampPosition: 'back', bgVariant: 'storm' },
];

const FOOT_SOCIAL = [
  { label: 'INSTAGRAM', handle: '@wearasur', icon: 'ig' },
  { label: 'WHATSAPP', handle: 'Order on chat', icon: 'wa' },
  { label: 'YOUTUBE', handle: 'Drop films', icon: 'yt' },
  { label: 'X / TWITTER', handle: '@wearasur', icon: 'x' },
];

const FOOT_ACCORDIONS = [
  { label: 'CATEGORIES', items: ['Founding Three', 'Full Moon Drops', 'Gold Tier', 'Blood Drops', 'Back-Print Tees', 'All Products'] },
  { label: 'THE BRAND', items: ['The Lore', 'The Doctrine', 'Drop Calendar', 'Journal', 'Press'] },
  { label: 'CUSTOMER CARE', items: ['Shipping & Returns', 'Size Guide', 'Care Manual', 'Track Order', 'Contact', 'FAQ'] },
];

Object.assign(window, {
  SHOP_PRODUCTS, SHOP_CHIPS, NAV_CATEGORIES, NAV_ACCOUNT,
  RECENTLY_VIEWED, FOOT_SOCIAL, FOOT_ACCORDIONS,
  FILTER_TIERS, FILTER_FITS, PRICE_BOUNDS,
  SIZE_RUN, PDP_BOOK, GALLERY_ANGLES,
  PAYMENT_METHODS, SAVED_ADDRESS,
});
