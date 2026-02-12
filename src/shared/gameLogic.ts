import type {
  PlaceableTile,
  TileOption,
  TurnOptions,
  Grid,
  PlacementConstraint,
} from './types/game';
import { GRID_SIZE, TOTAL_TURNS, type CellTile } from './types/game';

const PLACEABLE_WITHOUT_CASTLE: PlaceableTile[] = ['mountain', 'tree', 'farm', 'house'];

function randomPlaceable(rng: () => number, allowCastle: boolean): PlaceableTile {
  if (allowCastle) return 'castle';
  const i = Math.floor(rng() * PLACEABLE_WITHOUT_CASTLE.length);
  return PLACEABLE_WITHOUT_CASTLE[i] ?? 'mountain';
}

/**
 * Pre-generate all tile options for the entire game (10 turns).
 * Castle appears exactly once in one of the 20 current-option slots (2 per turn × 10).
 */
export function generateAllTurnOptions(rng: () => number): TurnOptions[] {
  const castleSlot = Math.floor(rng() * (TOTAL_TURNS * 2)); // 0..19
  const options: TurnOptions[] = [];

  for (let t = 0; t < TOTAL_TURNS; t++) {
    const a = t * 2;
    const b = t * 2 + 1;
    const tileA = randomPlaceable(rng, a === castleSlot);
    const tileB = randomPlaceable(rng, b === castleSlot);
    const rowIndex = Math.floor(rng() * GRID_SIZE) + 1;
    const colIndex = Math.floor(rng() * GRID_SIZE) + 1;
    const firstIsRow = rng() < 0.5;
    const optA: TileOption = {
      tile: tileA,
      constraint: firstIsRow
        ? { kind: 'row', index: rowIndex }
        : { kind: 'column', index: colIndex },
    };
    const optB: TileOption = {
      tile: tileB,
      constraint: firstIsRow
        ? { kind: 'column', index: colIndex }
        : { kind: 'row', index: rowIndex },
    };
    const current: [TileOption, TileOption] = [optA, optB];
    options.push({
      current,
      next: [current[0], current[1]],
    });
  }

  for (let t = 0; t < TOTAL_TURNS - 1; t++) {
    const curr = options[t];
    const nextTurn = options[t + 1];
    if (curr && nextTurn) curr.next = [...nextTurn.current];
  }

  return options;
}

/** Create 6×6 grid with 1–2 pre-placed rocks. */
export function createInitialGrid(rng: () => number): Grid {
  const grid: Grid = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, (): CellTile => 'grass')
  );
  // Place 1 or 2 rocks randomly
  const rockCount = rng() < 0.5 ? 1 : 2;
  let placed = 0;
  while (placed < rockCount) {
    const r = Math.floor(rng() * GRID_SIZE);
    const c = Math.floor(rng() * GRID_SIZE);
    if (grid[r]![c] === 'grass') {
      grid[r]![c] = 'rock';
      placed++;
    }
  }
  return grid;
}

// --- Scoring: helpers ---

const ORTH: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const NEARBY_DELTAS: [number, number][] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

function getOrthogonalNeighbors(_grid: Grid, r: number, c: number): [number, number][] {
  const out: [number, number][] = [];
  for (const [dr, dc] of ORTH) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) out.push([nr, nc]);
  }
  return out;
}

function getNearbyCells(_grid: Grid, r: number, c: number): [number, number][] {
  const out: [number, number][] = [];
  for (const [dr, dc] of NEARBY_DELTAS) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) out.push([nr, nc]);
  }
  return out;
}

/** Orthogonally adjacent? */
function isAdjacent(r: number, c: number, tr: number, tc: number): boolean {
  return (Math.abs(r - tr) === 1 && c === tc) || (r === tr && Math.abs(c - tc) === 1);
}
function shortestGrassPath(grid: Grid, sr: number, sc: number, tr: number, tc: number): number {
  const visited = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;
  const q: [number, number, number][] = [[sr, sc, 0]];
  visited.add(key(sr, sc));

  while (q.length > 0) {
    const [r, c, dist] = q.shift()!;
    if (r === tr && c === tc) return dist;
    if (isAdjacent(r, c, tr, tc)) return dist;
    for (const [nr, nc] of getOrthogonalNeighbors(grid, r, c)) {
      const cell = grid[nr]?.[nc];
      if (cell !== 'grass') continue;
      const k = key(nr, nc);
      if (visited.has(k)) continue;
      visited.add(k);
      q.push([nr, nc, dist + 1]);
    }
  }
  return -1;
}

/**
 * Compute total score from the full grid.
 */
export function computeScore(grid: Grid): number {
  let total = 0;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = grid[r]?.[c];
      if (cell === undefined || cell === 'grass' || cell === 'rock') continue;

      if (cell === 'mountain') {
        const nearby = getNearbyCells(grid, r, c);
        const treeCount = nearby.filter(([nr, nc]) => grid[nr]?.[nc] === 'tree').length;
        total += treeCount;
        continue;
      }

      if (cell === 'tree') {
        const touching = getOrthogonalNeighbors(grid, r, c);
        const treeCount = touching.filter(([nr, nc]) => grid[nr]?.[nc] === 'tree').length;
        total += treeCount;
        continue;
      }

      if (cell === 'farm') {
        const touching = getOrthogonalNeighbors(grid, r, c);
        const grassCount = touching.filter(([nr, nc]) => grid[nr]?.[nc] === 'grass').length;
        total += grassCount;
        continue;
      }

      if (cell === 'castle') {
        // Find nearest house by BFS over grass-only path; score = path length in grass tiles.
        let bestPath = -1;
        for (let hr = 0; hr < GRID_SIZE; hr++) {
          for (let hc = 0; hc < GRID_SIZE; hc++) {
            if (grid[hr]?.[hc] !== 'house') continue;
            const path = shortestGrassPath(grid, r, c, hr, hc);
            if (path >= 0 && (bestPath < 0 || path < bestPath)) bestPath = path;
          }
        }
        total += bestPath >= 0 ? bestPath : 0;
        continue;
      }

      if (cell === 'house') {
        const nearby = getNearbyCells(grid, r, c);
        const types = new Set<CellTile>();
        for (const [nr, nc] of nearby) {
          const t = grid[nr]?.[nc];
          if (t != null) types.add(t);
        }
        total += types.size;
      }
    }
  }

  return total;
}

/**
 * Check if (row, col) is valid for the given constraint (only grass cells in that row/column).
 */
export function isValidPlacement(
  grid: Grid,
  row: number,
  col: number,
  constraint: PlacementConstraint
): boolean {
  if (grid[row]?.[col] !== 'grass') return false;
  if (constraint.kind === 'row') return constraint.index === row + 1; // 1-based
  return constraint.index === col + 1;
}

/**
 * Get all valid [row, col] positions for the given constraint.
 */
export function getValidPositions(grid: Grid, constraint: PlacementConstraint): [number, number][] {
  const out: [number, number][] = [];
  if (constraint.kind === 'row') {
    const r = constraint.index - 1;
    for (let c = 0; c < GRID_SIZE; c++) if (grid[r]?.[c] === 'grass') out.push([r, c]);
  } else {
    const c = constraint.index - 1;
    for (let r = 0; r < GRID_SIZE; r++) if (grid[r]?.[c] === 'grass') out.push([r, c]);
  }
  return out;
}
