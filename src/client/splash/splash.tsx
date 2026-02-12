import '../index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const PREVIEW_GRID: string[][] = [
  ['🌲', '🟩', '⛰️', '🌲'],
  ['🟩', '🏠', '🌲', '🟩'],
  ['🌾', '🟩', '🏰', '🌾'],
  ['🟩', '🌲', '🟩', '⛰️'],
];

const TILE_BG: Record<string, string> = {
  '🟩': 'bg-green-700/70',
  '🌲': 'bg-green-800/60',
  '⛰️': 'bg-stone-500/50',
  '🏠': 'bg-amber-700/40',
  '🏰': 'bg-purple-700/40',
  '🌾': 'bg-yellow-600/40',
};

export const Splash = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="flex relative flex-col justify-center items-center min-h-screen gap-5 px-4"
      style={{ background: 'linear-gradient(160deg, #2d3a1e 0%, #1a1a1c 40%, #1c1926 100%)' }}
    >
      <div
        className="transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.92)',
        }}
      >
        <div
          className="grid gap-1 p-1.5 rounded-xl border-2 border-white/10"
          style={{
            gridTemplateColumns: 'repeat(4, 44px)',
            gridTemplateRows: 'repeat(4, 44px)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          {PREVIEW_GRID.flat().map((emoji, i) => (
            <div
              key={i}
              className={`flex items-center justify-center rounded-lg text-xl ${TILE_BG[emoji] ?? 'bg-green-700/70'}`}
              style={{
                animationDelay: `${i * 60 + 300}ms`,
                animation: 'fadeInCell 0.4s ease-out both',
              }}
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex flex-col items-center gap-3 transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transitionDelay: '200ms',
        }}
      >
        <h1
          className="text-4xl font-extrabold text-center text-white tracking-tight select-none"
          style={{
            textShadow: '0 2px 12px rgba(0,0,0,0.4), 0 0 24px rgba(107, 142, 35, 0.15)',
            letterSpacing: '-0.02em',
          }}
        >
          Miniature Borough
        </h1>
        <p
          className="text-base text-center max-w-[260px] leading-relaxed font-medium"
          style={{
            color: 'rgba(226, 232, 240, 0.85)',
            textShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        >
          Place tiles. Build your borough.
        </p>
      </div>

      <div
        className="transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transitionDelay: '400ms',
        }}
      >
        <button
          type="button"
          className="group flex items-center justify-center gap-3 text-white font-bold w-auto min-w-[160px] h-14 rounded-full cursor-pointer px-10 text-lg transition-all duration-300 hover:scale-[1.05] hover:brightness-110 active:scale-[0.98] active:brightness-95 border border-white/20"
          style={{
            background: 'linear-gradient(145deg, #7a9e2e 0%, #5a8c18 50%, #4a7c10 100%)',
            boxShadow:
              '0 4px 20px rgba(107, 142, 35, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          <svg
            className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
          <span className="tracking-wide">Play Now</span>
        </button>
      </div>


      <style>{`
        @keyframes fadeInCell {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
