import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPostRng } from '../../shared/dailySeed';
import {
  createInitialGrid,
  generateAllTurnOptions,
  computeScore,
  isValidPlacement,
  getValidPositions,
} from '../../shared/gameLogic';
import type { GameState } from '../../shared/types/game';
import { TOTAL_TURNS } from '../../shared/types/game';

type GameConfig = {
  initial_grid: ReturnType<typeof createInitialGrid>;
  all_turn_options: ReturnType<typeof generateAllTurnOptions>;
};

function getGameConfig(post_id: string): GameConfig {
  const rng = createPostRng(post_id);
  const initial_grid = createInitialGrid(rng);
  const all_turn_options = generateAllTurnOptions(rng);
  return { initial_grid, all_turn_options };
}

function getInitialStateFromConfig(config: GameConfig): GameState {
  const opts = config.all_turn_options[0];
  if (!opts) throw new Error('Failed to generate turn options');
  return {
    grid: config.initial_grid.map((row) => [...row]),
    turn: 0,
    phase: 'playing',
    score: computeScore(config.initial_grid),
    currentOptions: opts.current,
    nextOptions: opts.next,
    selectedTileIndex: null,
    hoverCell: null,
  };
}

export function useGame(post_id: string) {
  const seed = post_id || 'default';
  const config = useMemo(() => getGameConfig(seed), [seed]);

  const [state, setState] = useState<GameState>(() => getInitialStateFromConfig(config));

  const allTurnOptions = config.all_turn_options;

  useEffect(() => {
    setState(getInitialStateFromConfig(config));
  }, [config]);

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
  };
}
