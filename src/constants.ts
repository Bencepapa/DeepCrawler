import { TileType } from "./types";

export const TILE_SIZE = 4;
export const MOVE_SPEED = 0.15;
export const ROTATE_SPEED = 0.1;

export const INITIAL_STATS = {
  hp: 100,
  maxHp: 100,
  strength: 10,
  firearm: 15,
  oxygen: 100,
  maxOxygen: 100,
};

export const MAP_DATA: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 15, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 0, 5, 0, 3, 3, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 5, 1, 1, 0, 7, 0, 0, 1],
  [1, 0, 0, 0, 8, 0, 9, 0, 10, 1],
  [1, 0, 11, 12, 0, 6, 0, 2, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 13, 0, 10, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 19, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const LEVEL_2_MAP: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 13, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 1],
  [1, 10, 0, 0, 0, 6, 0, 0, 6, 0, 0, 0, 0, 10, 1],
  [1, 16, 16, 16, 16, 16, 18, 20, 20, 20, 20, 20, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 13, 0, 0, 0, 17, 0, 0, 0, 0, 13, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 18, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 21, 21, 21, 0, 0, 22, 22, 22, 0, 0, 21, 21, 21, 1],
  [1, 21, 0, 10, 0, 6, 22, 6, 0, 10, 0, 21, 0, 0, 1],
  [1, 21, 0, 0, 0, 0, 22, 0, 0, 0, 0, 21, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const TILE_DESCRIPTIONS: Record<number, string> = {
  [TileType.PILLAR]: "A heavy support pillar, reinforcing the ship's hull against the vacuum of space.",
  [TileType.VENT]: "A maintenance vent. You can hear the faint hum of the life support system.",
  [TileType.OBSTACLE]: "A pile of debris, blocking the way.",
  [TileType.BARRICADE]: "A low barricade, perfect for taking cover.",
  [TileType.BOX]: "A heavy cargo box. You could probably jump over it.",
  [TileType.LIGHT_BOTTOM]: "A floor-level light fixture, casting a dim glow upwards.",
  [TileType.LIGHT_MIDDLE]: "A wall-mounted light panel, showing some diagnostic information.",
  [TileType.WINDOW_WALL]: "A reinforced observation window, showing the endless void of space.",
  [TileType.DISPLAY_WALL]: "A wall-mounted display, showing some ship diagnostics.",
  [TileType.RADAR_WALL]: "A tactical radar display, showing the surrounding area.",
  [TileType.SEGMENTED_WALL]: "A horizontally segmented wall with angled top and bottom sections.",
  [TileType.VERTICALLY_SEGMENTED_WALL]: "A vertically segmented wall with alternating depth panels.",
  [TileType.LAMP_WALL]: "A service wall covered in blinking diagnostic lamps.",
  [TileType.SERVICE_TUNNEL]: "A service tunnel running beneath the floor grating.",
  [TileType.SERVICE_PATH_STRAIGHT]: "A narrow service pathway between heavy machinery.",
  [TileType.SERVICE_PATH_JUNCTION]: "A junction in the service pathway system.",
  [TileType.BULKHEAD_DOOR]: "A heavy blue bulkhead door. It looks like it leads to another section of the ship.",
};
