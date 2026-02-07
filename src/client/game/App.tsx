import { useCallback } from 'react';
import { useGame } from '../hooks/useGame';
import {
  TILE_EMOJI,
  GRID_SIZE,
  TOTAL_TURNS,
  type PlacementConstraint,
  type CellTile,
} from '../../shared/types/game';
import { clsx } from 'clsx';

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
        'w-5 h-5 min-w-[20px] min-h-[20px] bg-black rounded-sm overflow-hidden flex',
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
        'flex items-center gap-2 rounded-lg border-2 transition-all min-h-[44px] px-3 py-2',
        'touch-manipulation',
        isSelected
          ? 'border-amber-500 bg-[var(--color-highlight)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-amber-400'
      )}
    >
      <PlacementIndicator constraint={option.constraint} isColumn={isColumn} />
      <span className="text-2xl" role="img" aria-label={option.tile}>
        {TILE_EMOJI[option.tile as CellTile]}
      </span>
    </button>
  );
}

function NextTilePreview({ option }: { option: { tile: string } }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] opacity-75 min-h-[44px] px-3 py-2">
      <span className="text-xl" role="img" aria-label={option.tile}>
        {TILE_EMOJI[option.tile as CellTile]}
      </span>
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
    utcDate,
  } = useGame();

  const selectedOption =
    state.selectedTileIndex !== null ? state.currentOptions[state.selectedTileIndex] : null;
  const validSet = selectedOption
    ? new Set(
        getValidPositions(state.grid, selectedOption.constraint).map(([r, c]) => `${r},${c}`)
      )
    : null;

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (state.phase !== 'playing' || selectedOption === null) return;
      if (checkValid(state.grid, row, col, selectedOption.constraint)) {
        placeTile(row, col);
      }
    },
    [state.phase, selectedOption, placeTile, checkValid, state.grid]
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
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors">
      <header className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-[var(--color-border)]">
        <h1 className="text-lg font-bold tracking-tight">Miniature Borough</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--color-text-muted)]" title="UTC date (daily puzzle)">
            {utcDate}
          </span>
          <span className="font-mono font-semibold text-[var(--color-score)]">
            Score: {state.score}
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">
            Turn {Math.min(state.turn + 1, TOTAL_TURNS)}/{TOTAL_TURNS}
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6 overflow-auto">
        {/* Grid */}
        <div
          className="grid gap-0.5 p-1 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-border)]"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(44px, 1fr))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, minmax(44px, 1fr))`,
            maxWidth: 'min(95vw, 320px)',
            maxHeight: 'min(95vw, 320px)',
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
                    'relative flex items-center justify-center rounded-md min-w-[44px] min-h-[44px] text-2xl transition-all touch-manipulation',
                    cell === 'grass'
                      ? 'bg-green-700/80 hover:bg-green-600/90'
                      : 'bg-[var(--color-surface)] border border-[var(--color-border)]',
                    isValid && 'ring-2 ring-amber-400 ring-offset-1 ring-offset-[var(--color-bg)]',
                    !isValid && selectedOption && cell === 'grass' && 'opacity-50'
                  )}
                  onClick={() => handleCellClick(r, c)}
                  onMouseEnter={() => handleCellEnter(r, c)}
                  onMouseLeave={handleCellLeave}
                  onFocus={() => handleCellEnter(r, c)}
                  onBlur={handleCellLeave}
                  disabled={state.phase !== 'playing' || selectedOption === null}
                  aria-label={`Cell ${r + 1},${c + 1} ${cell}`}
                >
                  {showGhost && selectedOption ? (
                    <span className="opacity-70" role="img">
                      {TILE_EMOJI[selectedOption.tile as CellTile]}
                    </span>
                  ) : (
                    <span role="img" aria-hidden={cell === 'grass'}>
                      {TILE_EMOJI[cell]}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {state.phase === 'playing' && (
          <>
            <section className="w-full max-w-md" aria-label="Current tile options">
              <h2 className="text-sm font-medium text-[var(--color-text-muted)] mb-2">
                Choose one
              </h2>
              <div className="flex gap-3 justify-center flex-wrap">
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
            </section>

            {state.turn < TOTAL_TURNS - 1 && (
              <section className="w-full max-w-md" aria-label="Next turn preview">
                <h2 className="text-sm font-medium text-[var(--color-text-muted)] mb-2">
                  Next turn
                </h2>
                <div className="flex gap-3 justify-center flex-wrap">
                  <NextTilePreview option={state.nextOptions[0]} />
                  <NextTilePreview option={state.nextOptions[1]} />
                </div>
              </section>
            )}
          </>
        )}

        {state.phase === 'ended' && (
          <p className="text-lg font-medium text-[var(--color-score)]">
            Puzzle complete! Final score: {state.score}
          </p>
        )}
      </main>
    </div>
  );
};
