export enum TileType {
  EMPTY = 0,
  WALL = 1,
  PILLAR = 2,
  ANGLED_WALL = 3,
  WINDOW_WALL = 4,
  DOOR = 5,
  VENT = 6,
  OBSTACLE = 7,
  KEY = 8,
  BARRICADE = 9,
  BOX = 10,
  LIGHT_BOTTOM = 11,
  LIGHT_MIDDLE = 12,
  CEILING_LAMP = 13,
  DISPLAY_WALL = 14,
  RADAR_WALL = 15,
  SEGMENTED_WALL = 16,
  SERVICE_PATH_STRAIGHT = 17,
  SERVICE_PATH_JUNCTION = 18,
  BULKHEAD_DOOR = 19,
  VERTICALLY_SEGMENTED_WALL = 20,
  LAMP_WALL = 21,
  SERVICE_TUNNEL = 22,
  NEON_TUBE_CYAN = 23,
  NEON_TUBE_PURPLE = 24,
  NEON_TUBE_PINK = 25,
  NEON_TUBE_WHITE = 26,
  NEON_CORNER_WALL = 27,
  QUARANTINE_DISPLAY = 28,
}

export enum Direction {
  NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3,
}

export enum DecalType {
  POSTER = 'POSTER',
  HULL_BREACH = 'HULL_BREACH',
  BULLET_IMPACT = 'BULLET_IMPACT',
  CLAW_MARK = 'CLAW_MARK',
  CRACK = 'CRACK',
  BULLET_SHELL = 'BULLET_SHELL',
  SMUDGE = 'SMUDGE',
}

export interface Decal {
  id: string;
  type: DecalType;
  pos: { x: number; y: number; z: number };
  rot: { x: number; y: number; z: number };
  scale: number;
  size?: number;
  metadata?: any;
  cleaned?: boolean;
  health?: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  strength: number;
  firearm: number;
  oxygen: number;
  maxOxygen: number;
  mopLevel: number;
  torchLevel: number;
}

export interface GameState {
  playerPos: { x: number; z: number };
  playerDir: Direction;
  stats: PlayerStats;
  isDefending: boolean;
  decals: Decal[];
  cleanupProgress: number;
  totalMess: number;
  isQuarantineActive: boolean;
  isQuarantineBypassed: boolean;
}

export interface MapTile {
  type: TileType;
  rotation?: number;
  interactive?: boolean;
  onUse?: () => void;
  metadata?: any;
}

export interface ObstacleProperties {
  shadowCasting: boolean;
  shadowRadius?: number; // 0 to 0.5, where 0.5 is full tile
  canJumpOver: boolean;
  canShootOver: boolean;
  destroyable: boolean;
  openable: boolean;
  walkable: boolean;
  lightRadius?: number;
  lightIntensity?: number;
}
