import React from 'react';
import { Calculator, BookOpen, FlaskConical, Cpu, GraduationCap, Layers, Heart } from 'lucide-react';

/* ── RentoraWordmark — replicates the uploaded logo exactly ─────── */
/*
  Design: RENT + [3-arrow recycling circle] + RA
  Font:   Space Grotesk 800 (already loaded in index.css)
  Color:  #9E1B1B (or white when dark=true)
*/
export const RentoraWordmark: React.FC<{
  dark?: boolean;
  color?: string;
  className?: string;
  /** px size of the text — default 22 */
  size?: number;
}> = ({ dark = false, color, className = '', size = 22 }) => {
  const c = color ?? (dark ? '#FFFFFF' : '#9E1B1B');
  const iconPx = size * 0.95;

  return (
    <div
      className={`inline-flex items-center select-none ${className}`}
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 800,
        fontSize: size,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        color: c,
      }}
    >
      {/* ── RENT ── */}
      <span>RENT</span>

      {/* ── Recycling O ── */}
      {/* SVG replica of the 3-arrow recycling symbol from the logo */}
      <svg
        viewBox="0 0 100 100"
        width={iconPx}
        height={iconPx}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', margin: '0 1px' }}
      >
        {/*
          3 arrows forming a triangle (recycling symbol).
          Each arrow = a thick arc path + an arrowhead polygon.
          Stroke is filled (not stroked) so it renders identically to the logo.
        */}

        {/* Arrow 1 — top-right → bottom (rotated 0°) */}
        <g transform="rotate(0, 50, 50)">
          {/* Arc body */}
          <path
            d="
              M50 12
              A40 40 0 0 1 84.64 70
              L79 67
              L84.64 82
              L70 76
              L75.6 73
              A33 33 0 0 0 50 19
              Z
            "
            fill={c}
          />
        </g>

        {/* Arrow 2 — bottom-right → left (rotated 120°) */}
        <g transform="rotate(120, 50, 50)">
          <path
            d="
              M50 12
              A40 40 0 0 1 84.64 70
              L79 67
              L84.64 82
              L70 76
              L75.6 73
              A33 33 0 0 0 50 19
              Z
            "
            fill={c}
          />
        </g>

        {/* Arrow 3 — left → top-right (rotated 240°) */}
        <g transform="rotate(240, 50, 50)">
          <path
            d="
              M50 12
              A40 40 0 0 1 84.64 70
              L79 67
              L84.64 82
              L70 76
              L75.6 73
              A33 33 0 0 0 50 19
              Z
            "
            fill={c}
          />
        </g>
      </svg>

      {/* ── RA ── */}
      <span>RA</span>
    </div>
  );
};


/* ── RentoraIcon ────────────────────────────────────────────────── */
export const RentoraIcon: React.FC<{ className?: string }> = ({ className = 'h-8 w-8' }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Block body */}
    <rect x="6" y="6" width="88" height="88" rx="22" fill="#9E1B1B" />
    {/* R letterform */}
    <path
      d="M26 78V22H52C65 22 73 29 73 41C73 50 67 56 58 59L78 78H60L43 61H39V78H26ZM39 50H50C58 50 62 46 62 40C62 34 57 31 50 31H39V50Z"
      fill="white"
    />
    {/* Speed swoosh accent */}
    <path d="M70 22L80 14C82 22 80 34 74 40L70 22Z" fill="#801414" opacity="0.8" />
  </svg>
);

/* ── RentoraLogo ────────────────────────────────────────────────── */
export const RentoraLogo: React.FC<{ className?: string; dark?: boolean }> = ({ className = 'h-8 w-auto', dark = false }) => (
  <div className={`flex items-center space-x-2.5 select-none ${className}`}>
    <RentoraIcon className="h-8 w-8 flex-shrink-0" />
    <span
      className="font-display font-black text-[22px] tracking-[-0.03em] leading-none"
      style={{ color: dark ? '#F8EDEC' : '#9E1B1B' }}
    >
      RENTOR<span style={{ color: dark ? '#F27B58' : '#9E1B1B' }}>A</span>
    </span>
  </div>
);

/* ── PaymentNotice ──────────────────────────────────────────────── */
export const PaymentNotice: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50 p-4 flex items-start gap-3 ${className}`}>
    <span className="text-xl mt-0.5">🤝</span>
    <div>
      <p className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 font-display mb-1">
        Offline Cash / UPI Handoff
      </p>
      <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
        Rentora does <strong>not</strong> process online payments. All transactions — Cash or UPI — happen in person at campus landmark meetup points.
      </p>
    </div>
  </div>
);

/* ── ArtworkTile ────────────────────────────────────────────────── */
export interface ArtworkTileProps {
  category: string | Record<string, any>;
  location?: string;
  theme?: 'mint' | 'peach' | 'lavender' | 'blue' | 'sand' | 'rose';
  title?: string;
  className?: string;
  onWishlistToggle?: (e: React.MouseEvent) => void;
  isWishlisted?: boolean;
}

const THEME_STYLES = {
  mint:     { bg: '#DCF2E9', text: '#1E6865', icon: '#1E6865' },
  peach:    { bg: '#FFE8DC', text: '#C04B2A', icon: '#C04B2A' },
  lavender: { bg: '#ECE4FC', text: '#653BB5', icon: '#653BB5' },
  blue:     { bg: '#DFF0FC', text: '#246596', icon: '#246596' },
  sand:     { bg: '#F7EED8', text: '#876527', icon: '#876527' },
  rose:     { bg: '#FDE4EA', text: '#AA2A4C', icon: '#AA2A4C' },
} as const;

function getCategoryString(category: string | Record<string, any>): string {
  if (typeof category === 'object' && category !== null) {
    return (category as any).name || '';
  }
  return String(category || '');
}

function CategoryIcon({ cat, size = 36 }: { cat: string; size?: number }) {
  const s = { width: size, height: size, strokeWidth: 1.5 };
  const c = cat.toUpperCase();
  if (c.includes('BOOK') || c.includes('TEXT') || c.includes('NOTE')) return <BookOpen style={s} />;
  if (c.includes('CALC') || c.includes('MATH')) return <Calculator style={s} />;
  if (c.includes('LAB') || c.includes('FLASK') || c.includes('CHEM') || c.includes('BIO')) return <FlaskConical style={s} />;
  if (c.includes('ELECT') || c.includes('CIRCUIT') || c.includes('CPU') || c.includes('CHIP')) return <Cpu style={s} />;
  if (c.includes('CAMPUS') || c.includes('STUDENT') || c.includes('LIFE')) return <GraduationCap style={s} />;
  if (c.includes('GEAR') || c.includes('TOOL') || c.includes('EQUIP')) return <Layers style={s} />;
  return <Cpu style={s} />;
}

export const ArtworkTile: React.FC<ArtworkTileProps> = ({
  category,
  location,
  theme = 'blue',
  title = '',
  className = 'h-48 w-full',
  onWishlistToggle,
  isWishlisted = false,
}) => {
  const t = THEME_STYLES[theme] || THEME_STYLES.blue;
  const catStr = getCategoryString(category);
  const displayCat = catStr || 'Gear';

  return (
    <div
      className={`relative ${className} overflow-hidden flex flex-col justify-between group transition-all duration-300`}
      style={{ background: t.bg, borderRadius: 20 }}
    >
      {/* Faint dot grid */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '10px 10px',
          color: t.text,
        }}
      />
      {/* Soft decorative blob */}
      <div
        className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-10 pointer-events-none"
        style={{ background: t.text }}
      />
      <div
        className="absolute -top-6 -left-6 w-24 h-24 rounded-full opacity-[0.07] pointer-events-none"
        style={{ background: t.text }}
      />

      {/* Top row: category badge + wishlist */}
      <div className="relative flex items-center justify-between p-3">
        <span
          className="text-[10px] font-black uppercase tracking-[0.15em] font-display px-2.5 py-1 rounded-full"
          style={{ color: t.text, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}
        >
          {displayCat}
        </span>
        {onWishlistToggle && (
          <button
            type="button"
            onClick={onWishlistToggle}
            className="p-1.5 rounded-full transition-transform hover:scale-110 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}
          >
            <Heart
              size={14}
              style={{ color: isWishlisted ? '#ef4444' : t.text }}
              fill={isWishlisted ? '#ef4444' : 'none'}
            />
          </button>
        )}
      </div>

      {/* Center icon badge */}
      <div className="relative my-auto flex flex-col items-center justify-center py-2">
        <div
          className="p-4 rounded-2xl shadow-lg transform rotate-6 group-hover:rotate-0 group-hover:scale-110 transition-all duration-300"
          style={{
            background: 'rgba(255,255,255,0.35)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.5)',
            color: t.text,
          }}
        >
          <CategoryIcon cat={catStr} size={32} />
        </div>
        {title && (
          <p
            className="mt-3 text-[10px] font-black text-center font-display tracking-tight truncate max-w-[90%] uppercase px-2"
            style={{ color: t.text }}
          >
            {title}
          </p>
        )}
      </div>

      {/* Bottom: location */}
      {location && (
        <div className="relative flex items-center gap-1.5 px-3 pb-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.text} strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span
            className="text-[9px] font-black uppercase tracking-widest font-display"
            style={{ color: t.text }}
          >
            {location}
          </span>
        </div>
      )}
    </div>
  );
};

export default RentoraLogo;
