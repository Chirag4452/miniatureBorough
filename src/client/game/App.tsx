import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../hooks/useGame';
import { useDailyAttempts } from '../hooks/useDailyAttempts';
import {
  TILE_EMOJI,
  GRID_SIZE,
  TOTAL_TURNS,
  type PlacementConstraint,
  type CellTile,
  type TileOption,
} from '../../shared/types/game';
import { clsx } from 'clsx';

const DAILY_ATTEMPTS_MAX = 3;

function TileIcon({ tile, className }: { tile: CellTile; className?: string }) {
  return (
    <span className={className} role="img" aria-label={tile}>
      {TILE_EMOJI[tile]}
    </span>
  );
}

function RulesSection() {
  return (
    <div className="flex flex-nowrap items-start justify-between gap-4 text-sm">
      <ul className="text-white space-y-1.5 min-w-0 flex-1">
        <li>
          <span role="img" aria-hidden>⛰️</span> <span className="font-semibold text-amber-300">1pt</span> for each nearby <span role="img" aria-hidden>🌲</span>.
        </li>
        <li>
          <span role="img" aria-hidden>🌲</span> <span className="font-semibold text-amber-300">1pt</span> for each touching <span role="img" aria-hidden>🌲</span>.
        </li>
        <li>
          <span role="img" aria-hidden>🌾</span> <span className="font-semibold text-amber-300">1pt</span> for each touching <span role="img" aria-hidden>🟩</span>.
        </li>
        <li>
          <span role="img" aria-hidden>🏰</span> <span className="font-semibold text-amber-300">1pt</span> for each <span role="img" aria-hidden>🟩</span> on route to nearest <span role="img" aria-hidden>🏠</span>.
        </li>
        <li>
          <span role="img" aria-hidden>🏠</span> <span className="font-semibold text-amber-300">1pt</span> per unique nearby type.
        </li>
      </ul>
      <div className="flex flex-col gap-3 shrink-0 items-center">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-white w-14 text-center">nearby:</span>
          <div className="grid grid-cols-3 gap-0.5 w-[36px]">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className={clsx(
                  'w-2 h-2 rounded-sm',
                  i === 4 ? 'bg-purple-400/80' : 'bg-green-600/80'
                )}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-white w-14 text-center">touching:</span>
          <div className="grid grid-cols-3 gap-0.5 w-[36px]">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className={clsx(
                  'w-2 h-2 rounded-sm',
                  i === 4 ? 'bg-purple-400/80' : [1, 3, 5, 7].includes(i) ? 'bg-green-600/80' : 'bg-gray-600/60'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RulesOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handle_key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handle_key);
    return () => window.removeEventListener('keydown', handle_key);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/90 cursor-default"
        onClick={onClose}
        aria-label="Close rules"
      />
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 id="rules-title" className="text-base sm:text-lg font-bold text-white">
            Rules
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-colors touch-manipulation"
            aria-label="Close rules"
          >
            ✕
          </button>
        </div>
        <RulesSection />
      </div>
    </div>
  );
}

function PlacementIndicator({
  constraint,
  isColumn,
}: {
  constraint: PlacementConstraint;
  isColumn: boolean;
}) {
  const highlightedIndex = constraint.index;
  return (
    <div
      className={clsx(
        'w-4 h-4 min-w-[16px] min-h-[16px] bg-black rounded-sm overflow-hidden flex',
        isColumn ? 'flex-row' : 'flex-col'
      )}
      aria-hidden
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className={clsx(
            'flex-1 min-w-0 min-h-0',
            isColumn ? 'w-px' : 'h-px'
          )}
          style={{
            backgroundColor:
              i === highlightedIndex ? 'var(--color-indicator-highlight)' : 'var(--color-indicator-line)',
            opacity: i === highlightedIndex ? 1 : 0.5,
          }}
        />
      ))}
    </div>
  );
}

function CurrentTileOption({
  option,
  isSelected,
  onSelect,
}: {
  option: { tile: string; constraint: PlacementConstraint };
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isColumn = option.constraint.kind === 'column';
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'flex items-center gap-1.5 rounded-lg transition-all min-h-[36px] px-2.5 py-1.5',
        'touch-manipulation',
        isSelected
          ? 'bg-[var(--color-highlight)]'
          : 'bg-[var(--color-surface)] hover:bg-[var(--color-highlight)]/50'
      )}
    >
      <PlacementIndicator constraint={option.constraint} isColumn={isColumn} />
      <TileIcon tile={option.tile as CellTile} className="text-xl" />
    </button>
  );
}

function NextTilePreview({ options }: { options: [TileOption, TileOption] }) {
  return (
    <div className="flex gap-3 items-center justify-center flex-wrap">
      <span className="text-sm font-medium text-white/60">Next</span>
      {options.map((option, i) => {
        const isColumn = option.constraint.kind === 'column';
        return (
          <div
            key={i}
            className="flex items-center gap-1.5 rounded-lg min-h-[36px] px-2.5 py-1.5 bg-[var(--color-surface)]/70 border border-[var(--color-border)]"
            aria-hidden
          >
            <PlacementIndicator constraint={option.constraint} isColumn={isColumn} />
            <TileIcon tile={option.tile as CellTile} className="text-xl" />
          </div>
        );
      })}
    </div>
  );
}

export const App = () => {
  const {
    state,
    selectTile,
    setHoverCell,
    placeTile,
    getValidPositions,
    isValidPlacement: checkValid,
  } = useGame();

  const { attempts_used, max_score, loading, record_attempt } = useDailyAttempts();
  const no_attempts_left = attempts_used >= DAILY_ATTEMPTS_MAX;
  const recorded_this_game = useRef(false);

  const [rules_open, set_rules_open] = useState(false);

  useEffect(() => {
    if (state.phase !== 'ended' || recorded_this_game.current) return;
    recorded_this_game.current = true;
    void record_attempt(state.score);
  }, [state.phase, state.score, record_attempt]);

  const selectedOption =
    state.selectedTileIndex !== null ? state.currentOptions[state.selectedTileIndex] : null;
  const validSet = selectedOption
    ? new Set(
        getValidPositions(state.grid, selectedOption.constraint).map(([r, c]) => `${r},${c}`)
      )
    : null;

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (no_attempts_left || state.phase !== 'playing' || selectedOption === null) return;
      if (checkValid(state.grid, row, col, selectedOption.constraint)) {
        placeTile(row, col);
      }
    },
    [no_attempts_left, state.phase, selectedOption, placeTile, checkValid, state.grid]
  );

  const handleCellEnter = useCallback(
    (row: number, col: number) => {
      if (selectedOption && checkValid(state.grid, row, col, selectedOption.constraint)) {
        setHoverCell([row, col]);
      } else {
        setHoverCell(null);
      }
    },
    [selectedOption, state.grid, checkValid, setHoverCell]
  );

  const handleCellLeave = useCallback(() => setHoverCell(null), [setHoverCell]);

  return (
    <div className="bg-pattern min-h-screen flex flex-col text-[var(--color-text)] transition-colors p-3 gap-3">
      <header className="content-panel relative flex flex-col gap-3">
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <h1 className="text-lg font-bold tracking-tight">Miniature Borough</h1>
          <button
            type="button"
            onClick={() => set_rules_open(true)}
            className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-[var(--color-text)] bg-[var(--color-surface)]/80 hover:bg-[var(--color-highlight)] border border-[var(--color-border)] transition-colors touch-manipulation"
            aria-label="Show rules"
          >
            ?
          </button>
          {!loading && (
            <span className="text-sm font-semibold text-amber-300 tabular-nums" aria-label={`Attempts ${attempts_used} of ${DAILY_ATTEMPTS_MAX}`}>
              {attempts_used}/{DAILY_ATTEMPTS_MAX}
            </span>
          )}
        </div>

        {no_attempts_left && (
          <p className="text-center text-amber-200 font-medium">
            No attempts left today. Best: {max_score}pts
          </p>
        )}

        {state.phase === 'playing' && !no_attempts_left && state.turn < TOTAL_TURNS - 1 && state.nextOptions && (
          <section className="w-full max-w-md mx-auto" aria-label="Next turn preview">
            <NextTilePreview options={state.nextOptions} />
          </section>
        )}

        <section className="w-full max-w-md min-h-[40px] flex flex-col justify-center mx-auto" aria-label={state.phase === 'playing' ? 'Current tile options' : 'Game result'}>
          {no_attempts_left ? (
            <p className="text-lg font-medium text-yellow-200 text-center">
              Come back tomorrow for a new puzzle.
            </p>
          ) : state.phase === 'playing' ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-3 items-center justify-center flex-wrap">
                <h2 className="text-sm font-medium text-white/80">
                  Pick a tile
                </h2>
                <CurrentTileOption
                  option={state.currentOptions[0]}
                  isSelected={state.selectedTileIndex === 0}
                  onSelect={() => selectTile(0)}
                />
                <CurrentTileOption
                  option={state.currentOptions[1]}
                  isSelected={state.selectedTileIndex === 1}
                  onSelect={() => selectTile(1)}
                />
              </div>
            </div>
          ) : (
            <p className="text-lg font-medium text-yellow-200 text-center">
              Puzzle complete! Final score: {state.score}pts
            </p>
          )}
        </section>
      </header>

      <RulesOverlay open={rules_open} onClose={() => set_rules_open(false)} />

      <main className={clsx('flex-1 flex flex-col items-center gap-2 overflow-auto', no_attempts_left && 'pointer-events-none opacity-75')}>
        <div className="flex flex-col items-center gap-2">
          <div
            className="grid gap-0.5 p-1 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-border)]"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(40px, 1fr))`,
              gridTemplateRows: `repeat(${GRID_SIZE}, minmax(40px, 1fr))`,
              maxWidth: 'min(85.5vw, 288px)',
              maxHeight: 'min(85.5vw, 288px)',
              aspectRatio: '1',
            }}
          >
            {state.grid.map((row, r) =>
              row.map((cell, c) => {
                const key = `${r},${c}`;
                const isValid = validSet?.has(key) ?? false;
                const isHover = state.hoverCell?.[0] === r && state.hoverCell?.[1] === c;
                const showGhost = isHover && selectedOption && cell === 'grass';

                return (
                  <button
                    key={key}
                    type="button"
                    className={clsx(
                      'relative flex items-center justify-center rounded-md min-w-[40px] min-h-[40px] text-2xl transition-all touch-manipulation',
                      cell === 'grass'
                        ? 'bg-green-700/80 hover:bg-green-600/90'
                        : cell === 'rock'
                          ? 'bg-green-500/70 cursor-default'
                          : 'bg-[var(--color-surface)] border border-[var(--color-border)]',
                      isValid && 'ring-2 ring-amber-400 ring-offset-1 ring-offset-[var(--color-bg)]',
                      !isValid && selectedOption && cell === 'grass' && 'opacity-50'
                    )}
                    onClick={() => handleCellClick(r, c)}
                    onMouseEnter={() => handleCellEnter(r, c)}
                    onMouseLeave={handleCellLeave}
                    onFocus={() => handleCellEnter(r, c)}
                    onBlur={handleCellLeave}
                    disabled={no_attempts_left || state.phase !== 'playing' || selectedOption === null}
                    aria-label={`Cell ${r + 1},${c + 1} ${cell}`}
                  >
                    {showGhost && selectedOption ? (
                      <TileIcon tile={selectedOption.tile as CellTile} className="opacity-70" />
                    ) : (
                      cell !== 'grass' ? (
                        <TileIcon tile={cell} />
                      ) : null
                    )}
                  </button>
                );
              })
            )}
          </div>
          <span className="self-end font-mono font-semibold text-yellow-400 text-lg">
            {state.score}pts
          </span>
        </div>
      </main>
    </div>
  );
};
