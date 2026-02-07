import type { PlaceableTile, TileOption, TurnOptions, Grid, PlacementConstraint } from './types/game';
import {
  GRID_SIZE,
  TOTAL_TURNS,
  type CellTile,
} from './types/game';

const PLACEABLE_WITHOUT_CASTLE: PlaceableTile[] = ['mountain', 'tree', 'farm', 'house'];

function randomConstraint(rng: () => number): PlacementConstraint {
  const kind = rng() < 0.5 ? 'row' : 'column';
  const index = Math.floor(rng() * GRID_SIZE) + 1; // 1–6
  return kind === 'row' ? { kind: 'row', index } : { kind: 'column', index };
}

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
    const current: [TileOption, TileOption] = [
      {
        tile: randomPlaceable(rng, a === castleSlot),
        constraint: randomConstraint(rng),
      },
      {
        tile: randomPlaceable(rng, b === castleSlot),
        constraint: randomConstraint(rng),
      },
    ];
    const nextA: TileOption = {
      tile: randomPlaceable(rng, false),
      constraint: randomConstraint(rng),
    };
    const nextB: TileOption = {
      tile: randomPlaceable(rng, false),
      constraint: randomConstraint(rng),
    };
    options.push({
      current,
      next: [nextA, nextB],
    });
  }

  return options;
}

/** Create empty 6×6 grid (all grass). */
export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, (): CellTile => 'grass')
  );
}

// --- Scoring: helpers ---

const ORTH: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const NEARBY_DELTAS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1],  [1, 0], [1, 1],
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

/** BFS shortest path length (only through grass) from (sr,sc) to (tr,tc). Returns -1 if no path. */
function shortestGrassPath(grid: Grid, sr: number, sc: number, tr: number, tc: number): number {
  const visited = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;
  const q: [number, number, number][] = [[sr, sc, 0]];
  visited.add(key(sr, sc));

  while (q.length > 0) {
    const [r, c, dist] = q.shift()!;
    if (r === tr && c === tc) return dist;
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
      if (cell === undefined || cell === 'grass') continue;

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
export function getValidPositions(
  grid: Grid,
  constraint: PlacementConstraint
): [number, number][] {
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
