import React from 'react';
import { Calculator, BookOpen, FlaskConical, Cpu, GraduationCap, Layers, Heart } from 'lucide-react';
import rentoraLogo from '../assets/rentora-logo.png';
import logoName from '../assets/logo-name.png';
import logoNameWhite from '../assets/logo-name-white.png';

/* ── RentoraWordmark — replicates the uploaded logo exactly ─────── */
/*
  Design: [Official logo image] + [Official wordmark image]
*/
export const RentoraWordmark: React.FC<{
  dark?: boolean;
  color?: string;
  className?: string;
  /** px size of the text — default 22 */
  size?: number;
}> = ({ dark = false, className = '', size = 22 }) => {
  return (
    <div className={`inline-flex items-center select-none gap-3 ${className}`}>
      {/* ── Official Logo Image Container ── */}
      <div 
        className="flex items-center justify-center bg-white border border-slate-200/50 rounded-2xl p-1.5 shadow-sm transition-transform duration-200 hover:scale-105 flex-shrink-0 overflow-hidden"
        style={{ 
          width: size * 1.6, 
          height: size * 1.6,
        }}
      >
        <img 
          src={rentoraLogo} 
          alt="Rentora Official Logo" 
          className="w-full h-full object-contain" 
          style={{ transform: 'scale(1.5)' }}
        />
      </div>

      {/* ── Official Wordmark Image (no bg, right side) ── */}
      <img 
        src={dark ? logoNameWhite : logoName} 
        alt="Rentora Wordmark" 
        className={`object-contain flex-shrink-0 ${dark ? 'brightness-0 invert' : ''}`} 
        style={{ 
          height: size * 0.95,
        }}
      />
    </div>
  );
};


/* ── RentoraIcon ────────────────────────────────────────────────── */
export const RentoraIcon: React.FC<{ className?: string }> = ({ className = 'h-10 w-10' }) => (
  <div className={`bg-white border border-slate-200/50 rounded-2xl p-1.5 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`}>
    <img 
      src={rentoraLogo} 
      alt="Rentora Icon" 
      className="h-full w-full object-contain" 
      style={{ transform: 'scale(1.5)' }}
    />
  </div>
);

/* ── RentoraLogo ────────────────────────────────────────────────── */
export const RentoraLogo: React.FC<{ className?: string; dark?: boolean }> = ({ className = 'h-8 w-auto', dark = false }) => (
  <div className={`flex items-center space-x-2.5 select-none ${className}`}>
    <RentoraIcon className="h-10 w-10 flex-shrink-0" />
    <img 
      src={dark ? logoNameWhite : logoName} 
      alt="Rentora Wordmark" 
      className={`h-6 object-contain flex-shrink-0 ${dark ? 'brightness-0 invert' : ''}`} 
    />
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
