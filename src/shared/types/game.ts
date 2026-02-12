/** Placeable tile types. Grass is implicit (unoccupied cells). */
export type PlaceableTile = 'mountain' | 'tree' | 'farm' | 'castle' | 'house';

/** Cell content: either Grass (implicit) or a placed tile. */
export type CellTile = PlaceableTile | 'grass' | 'rock';

export const TILE_EMOJI: Record<CellTile, string> = {
  mountain: '⛰️',
  tree: '🌲',
  farm: '🌾',
  castle: '🏰',
  house: '🏠',
  grass: '🟩',
  rock: '🪨',
};

/** Constraint: tile can only be placed in this row (1–6) or this column (1–6). */
export type PlacementConstraint =
  | { kind: 'row'; index: number }
  | { kind: 'column'; index: number };

/** One of the two tile options for a turn. */
export type TileOption = {
  tile: PlaceableTile;
  constraint: PlacementConstraint;
};

/** Full options for a turn: two current + two next (preview). */
export type TurnOptions = {
  current: [TileOption, TileOption];
  next: [TileOption, TileOption];
};

export const GRID_SIZE = 6;
export const TOTAL_TURNS = 10;

export type Grid = CellTile[][];

export type GamePhase = 'playing' | 'ended';

export type GameState = {
  grid: Grid;
  turn: number;
  phase: GamePhase;
  score: number;
  currentOptions: [TileOption, TileOption];
  nextOptions: [TileOption, TileOption];
  /** Which of the two current tiles is selected (0 or 1), or null. */
  selectedTileIndex: 0 | 1 | null;
  /** Hovered cell for ghost preview [row, col] or null. */
  hoverCell: [number, number] | null;
};
