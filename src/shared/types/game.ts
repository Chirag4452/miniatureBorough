export type PlaceableTile = 'mountain' | 'tree' | 'farm' | 'castle' | 'house';

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

export type PlacementConstraint =
  | { kind: 'row'; index: number }
  | { kind: 'column'; index: number };

export type TileOption = {
  tile: PlaceableTile;
  constraint: PlacementConstraint;
};

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
  selectedTileIndex: 0 | 1 | null;
  hoverCell: [number, number] | null;
};
