import { TileType, ObstacleProperties } from "./types";

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
  [1, 1, 21, 1, 1, 1, 1, 1, 1, 1],
  [1, 15, 0, 0, 0, 0, 0, 24, 0, 1],
  [14, 0, 2, 0, 5, 0, 3, 3, 0, 1],
  [1, 0, 0, 0, 27, 0, 0, 0, 0, 1],
  [1, 1, 5, 1, 21, 0, 7, 0, 26, 1],
  [1, 0, 0, 0, 8, 0, 9, 0, 10, 1],
  [1, 0, 11, 12, 0, 6, 0, 2, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 13, 0, 10, 0, 23, 1],
  [1, 0, 27, 1, 0, 0, 1, 1, 19, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const LEVEL_2_MAP: number[][] = [
  [1, 1, 1, 21, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [21, 0, 0, 13, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 1],
  [1, 10, 0, 0, 0, 6, 0, 0, 6, 0, 0, 0, 0, 10, 1],
  [1, 16, 16, 16, 16, 16, 17, 20, 20, 20, 20, 20, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 18, 0, 0, 0, 10, 0, 0, 0, 1],
  [1, 0, 25, 10, 0, 0, 18, 0, 0, 0, 0, 13, 0, 0, 1],
  [1, 1, 1, 1, 27, 1, 17, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 21, 21, 21, 0, 0, 22, 22, 22, 22, 22, 0, 0, 0, 1],
  [1, 0, 0, 10, 0, 6, 22, 6, 0, 10, 0, 0, 0, 0, 1],
  [1, 10, 0, 0, 0, 0, 22, 0, 0, 0, 0, 21, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 19, 1],
];

export const LEVEL_3_MAP: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 23, 0, 0, 24, 0, 0, 25, 0, 0, 26, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 27, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 26, 0, 0, 25, 0, 0, 24, 0, 0, 23, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export interface SectorConfig {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  ambientColor: string;
}

export interface LevelConfig {
  name: string;
  map: number[][];
  lightmapEnabled: boolean;
  sectors?: SectorConfig[];
  defaultAmbient?: string;
  lightOverrides?: Record<string, { radius?: number; intensity?: number }>;
}

export const LEVELS: Record<number, LevelConfig> = {
  1: {
    name: "SUB-DECK 4: MAINTENANCE",
    map: MAP_DATA,
    lightmapEnabled: true,
    defaultAmbient: '#050505',
    sectors: [
      { x1: 0, z1: 0, x2: 10, z2: 4, ambientColor: '#0a0a0a' }, // Slightly brighter top area
      { x1: 0, z1: 5, x2: 10, z2: 11, ambientColor: '#020202' }, // Darker bottom area
    ],
    lightOverrides: {
      "2,6": { radius: 15, intensity: 10 }, // Example override for a specific light
    }
  },
  2: {
    name: "DECK 3: STORAGE BAY",
    map: LEVEL_2_MAP,
    lightmapEnabled: false,
  },
  3: {
    name: "DECK 2: NEON DISTRICT",
    map: LEVEL_3_MAP,
    lightmapEnabled: true,
    defaultAmbient: '#020205',
  }
};

export const TILE_PROPERTIES: Record<number, ObstacleProperties> = {
  [TileType.EMPTY]: { shadowCasting: false, canJumpOver: false, canShootOver: true, destroyable: false, openable: false, walkable: true },
  [TileType.WALL]: { shadowCasting: true, shadowRadius: 0.46, canJumpOver: false, canShootOver: false, destroyable: false, openable: false, walkable: false },
  [TileType.PILLAR]: { shadowCasting: true, shadowRadius: 0.10, canJumpOver: false, canShootOver: false, destroyable: false, openable: false, walkable: false },
  [TileType.ANGLED_WALL]: { shadowCasting: true, shadowRadius: 0.4, canJumpOver: false, canShootOver: false, destroyable: false, openable: false, walkable: false },
  [TileType.WINDOW_WALL]: { shadowCasting: true, shadowRadius: 0.5, canJumpOver: false, canShootOver: true, destroyable: false, openable: false, walkable: false },
  [TileType.DOOR]: { shadowCasting: true, shadowRadius: 0.4, canJumpOver: false, canShootOver: false, destroyable: false, openable: true, walkable: false },
  [TileType.BULKHEAD_DOOR]: { shadowCasting: true, shadowRadius: 0.5, canJumpOver: false, canShootOver: false, destroyable: false, openable: true, walkable: false },
  [TileType.VENT]: { shadowCasting: false, shadowRadius: 0.5, canJumpOver: false, canShootOver: false, destroyable: true, openable: false, walkable: true, lightRadius: 1.0, lightIntensity: 1 },
  [TileType.OBSTACLE]: { shadowCasting: true, shadowRadius: 0.20, canJumpOver: true, canShootOver: true, destroyable: true, openable: false, walkable: false },
  [TileType.BARRICADE]: { shadowCasting: true, shadowRadius: 0.10, canJumpOver: true, canShootOver: true, destroyable: true, openable: false, walkable: false },
  [TileType.BOX]: { shadowCasting: true, shadowRadius: 0.25, canJumpOver: true, canShootOver: true, destroyable: true, openable: false, walkable: false },
  [TileType.LIGHT_BOTTOM]: { shadowCasting: false, canJumpOver: false, canShootOver: true, destroyable: false, openable: false, walkable: true, lightRadius: 7, lightIntensity: 5 },
  [TileType.LIGHT_MIDDLE]: { shadowCasting: false, canJumpOver: false, canShootOver: true, destroyable: false, openable: false, walkable: true, lightRadius: 7, lightIntensity: 8 },
  [TileType.CEILING_LAMP]: { shadowCasting: false, canJumpOver: false, canShootOver: true, destroyable: false, openable: false, walkable: true, lightRadius: 4, lightIntensity: 5 },
  [TileType.DISPLAY_WALL]: { shadowCasting: true, shadowRadius: 0.4, canJumpOver: false, canShootOver: false, destroyable: false, openable: false, walkable: false, lightRadius: 2, lightIntensity: 5 },
  [TileType.RADAR_WALL]: { shadowCasting: true, shadowRadius: 0.5, canJumpOver: false, canShootOver: false, destroyable: false, openable: false, walkable: false, lightRadius: 2, lightIntensity: 5 },
  [TileType.LAMP_WALL]: { shadowCasting: true, shadowRadius: 0.5, canJumpOver: false, canShootOver: false, destroyable: false, openable: false, walkable: false, lightRadius: 2.2, lightIntensity: 5 },
  [TileType.KEY]: { shadowCasting: false, canJumpOver: false, canShootOver: true, destroyable: false, openable: false, walkable: true },
  [TileType.SEGMENTED_WALL]: { shadowCasting: true, shadowRadius: 0.4, canJumpOver: false, canShootOver: false, destroyable: false, openable: false, walkable: false },
  [TileType.VERTICALLY_SEGMENTED_WALL]: { shadowCasting: true, shadowRadius: 0.4, canJumpOver: false, canShootOver: false, destroyable: false, openable: false, walkable: false },
  [TileType.SERVICE_PATH_STRAIGHT]: { shadowCasting: true, shadowRadius: 0.4, canJumpOver: false, canShootOver: true, destroyable: false, openable: false, walkable: true },
  [TileType.SERVICE_PATH_JUNCTION]: { shadowCasting: true, shadowRadius: 0.4, canJumpOver: false, canShootOver: true, destroyable: false, openable: false, walkable: true, lightRadius: 0.5, lightIntensity: 5 },
  [TileType.SERVICE_TUNNEL]: { shadowCasting: false, canJumpOver: false, canShootOver: true, destroyable: false, openable: false, walkable: true, lightRadius: 1.5, lightIntensity: 5 },
  [TileType.NEON_TUBE_CYAN]: { shadowCasting: false, canJumpOver: false, canShootOver: true, destroyable: false, openable: false, walkable: true, lightRadius: 2, lightIntensity: 4 },
  [TileType.NEON_TUBE_PURPLE]: { shadowCasting: false, canJumpOver: false, canShootOver: true, destroyable: false, openable: false, walkable: true, lightRadius: 2, lightIntensity: 4 },
  [TileType.NEON_TUBE_PINK]: { shadowCasting: false, canJumpOver: false, canShootOver: true, destroyable: false, openable: false, walkable: true, lightRadius: 2, lightIntensity: 4 },
  [TileType.NEON_TUBE_WHITE]: { shadowCasting: false, canJumpOver: false, canShootOver: true, destroyable: false, openable: false, walkable: true, lightRadius: 2, lightIntensity: 4 },
  [TileType.NEON_CORNER_WALL]: { shadowCasting: true, shadowRadius: 0.5, canJumpOver: false, canShootOver: false, destroyable: false, openable: false, walkable: false, lightRadius: 3, lightIntensity: 5 },
};

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
  [TileType.NEON_TUBE_CYAN]: "A horizontal cyan neon tube, casting a vibrant glow.",
  [TileType.NEON_TUBE_PURPLE]: "A horizontal purple neon tube, casting a deep glow.",
  [TileType.NEON_TUBE_PINK]: "A horizontal pink neon tube, casting a bright glow.",
  [TileType.NEON_TUBE_WHITE]: "A horizontal white neon tube, casting a clean glow.",
  [TileType.NEON_CORNER_WALL]: "A wall with a bright vertical neon tube embedded in the corner.",
};
