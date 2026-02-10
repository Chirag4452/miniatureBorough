import '../index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

/* Mini preview grid — a static decorative 4×4 board */
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
    // Trigger entrance animation after mount
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="flex relative flex-col justify-center items-center min-h-screen gap-5 px-4"
      style={{ background: 'linear-gradient(160deg, #2d3a1e 0%, #1a1a1c 40%, #1c1926 100%)' }}
    >
      {/* Decorative mini grid */}
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

      {/* Title & subtitle */}
      <div
        className="flex flex-col items-center gap-2 transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transitionDelay: '200ms',
        }}
      >
        <h1 className="text-3xl font-bold text-center text-white tracking-tight">
          Miniature Borough
        </h1>
        <p className="text-sm text-center text-gray-400 max-w-[240px] leading-relaxed">
          Place tiles. Build your borough. Chase the high score.
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          🗓️ New puzzle every day
        </p>
      </div>

      {/* Play button */}
      <div
        className="transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transitionDelay: '400ms',
        }}
      >
        <button
          className="flex items-center justify-center gap-2 text-white font-semibold w-auto h-12 rounded-full cursor-pointer px-8 text-base transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #6b8e23 0%, #4a7c10 100%)',
            boxShadow: '0 4px 20px rgba(107, 142, 35, 0.35)',
          }}
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          <span>▶</span>
          <span>Play</span>
        </button>
      </div>

      {/* Scoring cheat sheet */}
      <div
        className="transition-all duration-700 ease-out mt-2"
        style={{
          opacity: visible ? 1 : 0,
          transitionDelay: '600ms',
        }}
      >
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>⛰️ → nearby 🌲</span>
          <span>🌲 → touching 🌲</span>
          <span>🌾 → touching 🟩</span>
          <span>🏰 → path to 🏠</span>
          <span>🏠 → unique neighbors</span>
        </div>
      </div>

      {/* Inline keyframe animation */}
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
