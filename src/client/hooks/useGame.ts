import { useCallback, useState } from 'react';
import { createDailyRng, getUtcDateString } from '../../shared/dailySeed';
import {
  createEmptyGrid,
  generateAllTurnOptions,
  computeScore,
  isValidPlacement,
  getValidPositions,
} from '../../shared/gameLogic';
import type { GameState } from '../../shared/types/game';
import { TOTAL_TURNS } from '../../shared/types/game';

const ALL_TURN_OPTIONS = (() => {
  const rng = createDailyRng();
  return generateAllTurnOptions(rng);
})();

function getInitialState(): GameState {
  const opts = ALL_TURN_OPTIONS[0];
  if (!opts) throw new Error('Failed to generate turn options');
  return {
    grid: createEmptyGrid(),
    turn: 0,
    phase: 'playing',
    score: 0,
    currentOptions: opts.current,
    nextOptions: opts.next,
    selectedTileIndex: null,
    hoverCell: null,
  };
}

export function useGame() {
  const [state, setState] = useState<GameState>(getInitialState);

  const allTurnOptions = ALL_TURN_OPTIONS;

  const selectTile = useCallback((index: 0 | 1) => {
    setState((s) => ({
      ...s,
      selectedTileIndex: s.selectedTileIndex === index ? null : index,
      hoverCell: null,
    }));
  }, []);

  const setHoverCell = useCallback((cell: [number, number] | null) => {
    setState((s) => ({ ...s, hoverCell: cell }));
  }, []);

  const placeTile = useCallback(
    (row: number, col: number) => {
      setState((s) => {
        if (s.phase !== 'playing' || s.selectedTileIndex === null) return s;
        const option = s.currentOptions[s.selectedTileIndex];
        if (!isValidPlacement(s.grid, row, col, option.constraint)) return s;

        const newGrid = s.grid.map((r, ri) =>
          r.map((cell, ci) => (ri === row && ci === col ? option.tile : cell))
        );
        const newTurn = s.turn + 1;
        const isLastTurn = newTurn >= TOTAL_TURNS;
        const phase: GameState['phase'] = isLastTurn ? 'ended' : 'playing';
        const score = computeScore(newGrid);
        const nextOpts = !isLastTurn ? allTurnOptions[newTurn] : null;

        return {
          grid: newGrid,
          turn: newTurn,
          phase,
          score,
          currentOptions: nextOpts?.current ?? s.currentOptions,
          nextOptions: nextOpts?.next ?? s.nextOptions,
          selectedTileIndex: null,
          hoverCell: null,
        };
      });
    },
    [allTurnOptions]
  );
  return {
    state,
    selectTile,
    setHoverCell,
    placeTile,
    allTurnOptions,
    isValidPlacement,
    getValidPositions,
    utcDate: getUtcDateString(),
  };
}
