import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Direction, 
  TileType, 
  PlayerStats, 
  GameState 
} from './types';
import { 
  TILE_SIZE, 
  MOVE_SPEED, 
  ROTATE_SPEED, 
  INITIAL_STATS, 
  MAP_DATA,
  LEVEL_2_MAP
} from './constants';
import { 
  createPillarGeometry, 
  createAngledWallGeometry, 
  createWindowWallGeometry, 
  createVentGeometry, 
  createObstacleGeometry,
  createKeyGeometry,
  createBarricadeGeometry,
  createBoxGeometry,
  createLightFixtureGeometry,
  createCeilingLampGeometry,
  createSegmentedWallGeometry,
  createServicePathGeometry,
  createBulkheadDoorGeometry,
  createVerticallySegmentedWallGeometry,
  createLampWallGeometry,
  createServiceTunnelGeometry
} from './geometries';
import { 
  Enemy, 
  EnemyType, 
  createSwarmMesh, 
  createDroneMesh 
} from './entities';
import { 
  Shield, 
  Zap, 
  Wind, 
  Heart, 
  MoveUp, 
  MoveDown, 
  RotateCcw, 
  RotateCw, 
  Hand, 
  Crosshair,
  AlertTriangle,
  Skull,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TILE_DESCRIPTIONS } from './constants';

interface Projectile {
  id: string;
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  mesh: THREE.Mesh;
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const playerRef = useRef<THREE.Group | null>(null);
  const lightsRef = useRef<Record<string, THREE.PointLight>>({});
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const fogRef = useRef<THREE.Fog | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const radarCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    playerPos: { x: 5, z: 5 },
    playerDir: Direction.EAST,
    stats: INITIAL_STATS,
    isDefending: false,
  });

  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const isMobileRef = useRef(false);
  const [envEffect, setEnvEffect] = useState<'none' | 'water' | 'vacuum'>('none');
  const [map, setMap] = useState(MAP_DATA);
  const [hasKey, setHasKey] = useState(false);
  const [overclockedTiles, setOverclockedTiles] = useState<Set<string>>(new Set());
  const overclockedTilesRef = useRef<Set<string>>(new Set());

  const isDefendingRef = useRef(false);
  const isAttackingRef = useRef(false);
  const envEffectRef = useRef<'none' | 'water' | 'vacuum'>('none');
  const logicalPos = useRef({ x: 5, z: 5 });
  const logicalDir = useRef(Direction.EAST);

  useEffect(() => {
    enemiesRef.current = enemies;
  }, [enemies]);

  useEffect(() => {
    projectilesRef.current = projectiles;
  }, [projectiles]);

  useEffect(() => {
    isDefendingRef.current = gameState.isDefending;
  }, [gameState.isDefending]);

  useEffect(() => {
    envEffectRef.current = envEffect;
  }, [envEffect]);

  useEffect(() => {
    overclockedTilesRef.current = overclockedTiles;
  }, [overclockedTiles]);

  // Movement state
  const targetPos = useRef(new THREE.Vector3(5 * TILE_SIZE, 0, 5 * TILE_SIZE));
  const targetRot = useRef(-Math.PI / 2); // Facing EAST
  const currentPos = useRef(new THREE.Vector3(5 * TILE_SIZE, 0, 5 * TILE_SIZE));
  const currentRot = useRef(-Math.PI / 2);

  useEffect(() => {
    const checkMobile = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const mobile = isTouch || window.innerWidth < 1024;
      setIsMobile(mobile);
      isMobileRef.current = mobile;
      
      if (cameraRef.current) {
        cameraRef.current.fov = mobile ? 85 : 75;
        cameraRef.current.updateProjectionMatrix();
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  };

  const checkCollision = useCallback((x: number, z: number) => {
    if (x < 0 || x >= map[0].length || z < 0 || z >= map.length) return true;
    const tile = map[z][x];
    return tile === TileType.WALL || tile === TileType.PILLAR || tile === TileType.ANGLED_WALL || tile === TileType.WINDOW_WALL || tile === TileType.DOOR || tile === TileType.BOX || tile === TileType.DISPLAY_WALL || tile === TileType.LIGHT_BOTTOM || tile === TileType.LIGHT_MIDDLE || tile === TileType.RADAR_WALL || tile === TileType.SEGMENTED_WALL || tile === TileType.BULKHEAD_DOOR || tile === TileType.VERTICALLY_SEGMENTED_WALL || tile === TileType.LAMP_WALL;
  }, [map]);

  const move = useCallback((forward: boolean) => {
    if (isGameOver) return;
    console.log('Move requested:', forward ? 'forward' : 'backward');
    
    let dx = 0;
    let dz = 0;
    
    if (logicalDir.current === Direction.NORTH) dz = -1;
    else if (logicalDir.current === Direction.SOUTH) dz = 1;
    else if (logicalDir.current === Direction.EAST) dx = 1;
    else if (logicalDir.current === Direction.WEST) dx = -1;
    
    if (!forward) {
      dx = -dx;
      dz = -dz;
    }
    
    const nextX = logicalPos.current.x + dx;
    const nextZ = logicalPos.current.z + dz;
    
    console.log(`Current: (${logicalPos.current.x}, ${logicalPos.current.z}), Target: (${nextX}, ${nextZ})`);

    const targetTile = map[nextZ]?.[nextX];
    const isBox = targetTile === TileType.BOX;

    if (isBox) {
      // Jump over box: move 2 tiles forward
      const jumpX = logicalPos.current.x + dx * 2;
      const jumpZ = logicalPos.current.z + dz * 2;
      
      if (!checkCollision(jumpX, jumpZ)) {
        logicalPos.current = { x: jumpX, z: jumpZ };
        targetPos.current.set(jumpX * TILE_SIZE, 0, jumpZ * TILE_SIZE);
        setGameState(prev => ({ ...prev, playerPos: { x: jumpX, z: jumpZ } }));
        showMessage("JUMPED OVER BOX");
        return;
      }
    }

    if (!checkCollision(nextX, nextZ)) {
      logicalPos.current = { x: nextX, z: nextZ };
      
      // Check for key collection
      if (map[nextZ][nextX] === TileType.KEY) {
        const newMap = [...map];
        newMap[nextZ] = [...newMap[nextZ]];
        newMap[nextZ][nextX] = TileType.EMPTY;
        setMap(newMap);
        setHasKey(true);
        showMessage("KEYCARD ACQUIRED");
      }

      const isBarricade = map[nextZ][nextX] === TileType.BARRICADE;
      targetPos.current.set(nextX * TILE_SIZE, isBarricade ? 0.5 : 0, nextZ * TILE_SIZE);
      setGameState(prev => ({ ...prev, playerPos: { x: nextX, z: nextZ } }));
    } else {
      console.log('Collision detected at:', nextX, nextZ);
    }
  }, [checkCollision, isGameOver]);

  const rotate = useCallback((clockwise: boolean) => {
    if (isGameOver) return;
    console.log('Rotate requested:', clockwise ? 'clockwise' : 'counter-clockwise');
    
    const nextDir = clockwise ? (logicalDir.current + 1) % 4 : (logicalDir.current + 3) % 4;
    logicalDir.current = nextDir;
    
    // Update visual target rotation synchronously with logical direction
    targetRot.current += clockwise ? -Math.PI / 2 : Math.PI / 2;
    
    setGameState(prev => ({ ...prev, playerDir: nextDir }));
  }, [isGameOver]);

  const strafe = useCallback((right: boolean) => {
    if (isGameOver) return;
    
    let dx = 0;
    let dz = 0;
    
    // Strafe is perpendicular to facing direction
    if (logicalDir.current === Direction.NORTH) dx = right ? 1 : -1;
    else if (logicalDir.current === Direction.SOUTH) dx = right ? -1 : 1;
    else if (logicalDir.current === Direction.EAST) dz = right ? 1 : -1;
    else if (logicalDir.current === Direction.WEST) dz = right ? -1 : 1;
    
    const nextX = logicalPos.current.x + dx;
    const nextZ = logicalPos.current.z + dz;
    
    if (!checkCollision(nextX, nextZ)) {
      logicalPos.current = { x: nextX, z: nextZ };
      
      if (map[nextZ][nextX] === TileType.KEY) {
        const newMap = [...map];
        newMap[nextZ] = [...newMap[nextZ]];
        newMap[nextZ][nextX] = TileType.EMPTY;
        setMap(newMap);
        setHasKey(true);
        showMessage("KEYCARD ACQUIRED");
      }

      const isBarricade = map[nextZ][nextX] === TileType.BARRICADE;
      targetPos.current.set(nextX * TILE_SIZE, isBarricade ? 0.5 : 0, nextZ * TILE_SIZE);
      setGameState(prev => ({ ...prev, playerPos: { x: nextX, z: nextZ } }));
    }
  }, [checkCollision, isGameOver]);

  const interact = useCallback(() => {
    if (isGameOver) return;
    const { x: px, z: pz } = logicalPos.current;
    const dir = logicalDir.current;
    let tx = px;
    let tz = pz;
    
    if (dir === Direction.NORTH) tz -= 1;
    else if (dir === Direction.SOUTH) tz += 1;
    else if (dir === Direction.EAST) tx += 1;
    else if (dir === Direction.WEST) tx -= 1;
    
    const tile = map[tz]?.[tx];
    if (tile === TileType.DOOR) {
      if (hasKey) {
        const newMap = [...map];
        newMap[tz] = [...newMap[tz]];
        newMap[tz][tx] = TileType.EMPTY;
        setMap(newMap);
        showMessage("DOOR UNLOCKED");
      } else {
        showMessage("Door is locked. Need keycard.");
      }
    } else if (tile === TileType.VENT) {
      if (Math.random() > 0.5) {
        setEnvEffect('vacuum');
        showMessage("CRITICAL: HULL BREACH DETECTED!");
        setTimeout(() => setEnvEffect('none'), 3000);
      } else {
        showMessage("Vent is sealed tight.");
      }
    } else if (tile === TileType.OBSTACLE) {
      showMessage("A heavy crate. Good for cover.");
    } else if (tile === TileType.WINDOW_WALL) {
      setEnvEffect('water');
      showMessage("Observing the deep ocean...");
      setTimeout(() => setEnvEffect('none'), 5000);
    } else if (tile === TileType.BULKHEAD_DOOR) {
      showMessage("TRANSITIONING TO NEXT LEVEL...");
      setTimeout(() => {
        setMap(LEVEL_2_MAP);
        logicalPos.current = { x: 1, z: 1 };
        targetPos.current.set(1 * TILE_SIZE, 0, 1 * TILE_SIZE);
        setGameState(prev => ({ ...prev, playerPos: { x: 1, z: 1 } }));
      }, 1000);
    } else if (tile === TileType.LIGHT_MIDDLE || tile === TileType.LIGHT_BOTTOM || tile === TileType.CEILING_LAMP) {
      const key = `${tx},${tz}`;
      setOverclockedTiles(prev => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
          showMessage("LIGHT SYSTEM STABILIZED");
        } else {
          next.add(key);
          showMessage("WARNING: LIGHT OVERCLOCKED - BLINDING INTENSITY!");
        }
        return next;
      });
    } else if (TILE_DESCRIPTIONS[tile]) {
      showMessage(TILE_DESCRIPTIONS[tile]);
    } else {
      showMessage("Nothing to interact with.");
    }
  }, [isGameOver, hasKey]);

  const attack = useCallback(() => {
    if (isGameOver) return;
    
    // Spawn projectile
    const projId = Math.random().toString(36).substr(2, 9);
    const projGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const projMat = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff,
    });
    const projMesh = new THREE.Mesh(projGeo, projMat);
    
    // Add a small point light to the projectile
    const projLight = new THREE.PointLight(0x00ffff, 2, 5);
    projMesh.add(projLight);
    
    // Start from camera position
    const startPos = currentPos.current.clone();
    startPos.y += 0.5; // Shooting from eye level
    
    // Direction based on player rotation
    const dirVec = new THREE.Vector3(0, 0, -1);
    if (playerRef.current) {
      dirVec.applyQuaternion(playerRef.current.quaternion);
    }
    
    projMesh.position.copy(startPos);
    if (sceneRef.current) sceneRef.current.add(projMesh);
    
    setProjectiles(prev => [...prev, {
      id: projId,
      pos: startPos,
      dir: dirVec,
      mesh: projMesh
    }]);

    const { x: px, z: pz } = logicalPos.current;
    const dir = logicalDir.current;
    let tx = px;
    let tz = pz;
    
    if (dir === Direction.NORTH) tz -= 1;
    else if (dir === Direction.SOUTH) tz += 1;
    else if (dir === Direction.EAST) tx += 1;
    else if (dir === Direction.WEST) tx -= 1;

    setEnemies(prev => {
      const target = prev.find(e => e.pos.x === tx && e.pos.z === tz);
      isAttackingRef.current = true;
      setTimeout(() => isAttackingRef.current = false, 500);
      if (target) {
        const damage = gameState.stats.firearm;
        const newHp = target.hp - damage;
        if (newHp <= 0) {
          if (sceneRef.current) sceneRef.current.remove(target.mesh);
          showMessage("Enemy Neutralized.");
          return prev.filter(e => e.id !== target.id);
        }
        showMessage(`Hit! Enemy HP: ${newHp}`);
        return prev.map(e => e.id === target.id ? { ...e, hp: newHp } : e);
      }
      return prev;
    });
  }, [gameState.stats.firearm, isGameOver]);

  const toggleDefense = useCallback(() => {
    setGameState(prev => ({ ...prev, isDefending: !prev.isDefending }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || isGameOver) return;
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': move(true); break;
        case 's': case 'arrowdown': move(false); break;
        case 'a': strafe(false); break;
        case 'd': strafe(true); break;
        case 'q': rotate(false); break;
        case 'e': rotate(true); break;
        case 'f': interact(); break;
        case 'r': attack(); break;
        case ' ': attack(); break;
        case 'shift': toggleDefense(); break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'shift') toggleDefense();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isGameOver, move, rotate, interact, attack, toggleDefense]);

  // Three.js Setup
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous scene if any
    while(containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    const fog = new THREE.Fog(0x050505, 2, 15);
    scene.fog = fog;
    fogRef.current = fog;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(isMobileRef.current ? 105 : 95, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const playerGroup = new THREE.Group();
    playerGroup.position.set(logicalPos.current.x * TILE_SIZE, 0, logicalPos.current.z * TILE_SIZE);
    scene.add(playerGroup);
    playerRef.current = playerGroup;

    // Attach camera to scene instead of player group for more explicit control
    scene.add(camera);
    camera.position.set(logicalPos.current.x * TILE_SIZE, 0, logicalPos.current.z * TILE_SIZE);
    
    // Initial rotation based on logicalDir
    const rot = -logicalDir.current * Math.PI / 2;
    
    camera.rotation.y = rot;
    currentRot.current = rot;
    targetRot.current = rot;
    
    // Sync current and target positions to avoid jumps on map reload
    currentPos.current.set(logicalPos.current.x * TILE_SIZE, 0, logicalPos.current.z * TILE_SIZE);
    targetPos.current.set(logicalPos.current.x * TILE_SIZE, 0, logicalPos.current.z * TILE_SIZE);

    const flashlight = new THREE.PointLight(0xffffff, 10, 30);
    flashlight.position.set(0, 0.5, 0);
    playerGroup.add(flashlight);

    // Map Generation
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.2, roughness: 0.8 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

    // Fog adjustment
    scene.fog = new THREE.Fog(0x050505, 5, 50);

    lightsRef.current = {};

    // Setup display canvas
    const displayCanvas = document.createElement('canvas');
    displayCanvas.width = 256;
    displayCanvas.height = 256;
    displayCanvasRef.current = displayCanvas;
    const displayCtx = displayCanvas.getContext('2d');
    displayCtxRef.current = displayCtx;
    const displayTexture = new THREE.CanvasTexture(displayCanvas);

    // Setup radar canvas
    const radarCanvas = document.createElement('canvas');
    radarCanvas.width = 256;
    radarCanvas.height = 256;
    radarCanvasRef.current = radarCanvas;
    const radarCtx = radarCanvas.getContext('2d');
    radarCtxRef.current = radarCtx;
    const radarTexture = new THREE.CanvasTexture(radarCanvas);

    // Setup lamp canvas
    const lampCanvas = document.createElement('canvas');
    lampCanvas.width = 256;
    lampCanvas.height = 256;
    const lampCtx = lampCanvas.getContext('2d');
    const lampTexture = new THREE.CanvasTexture(lampCanvas);
    const lampCtxRef = { current: lampCtx };

    // Display animation setup
    const setup = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 256, 256);
    };
    if (displayCtx) setup(displayCtx);

    const draw = (ctx: CanvasRenderingContext2D, time: number) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 2;
      
      // Draw some "diagnostics"
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const y = 50 + i * 20;
        const x = 20 + Math.sin(time * 0.005 + i) * 10;
        ctx.moveTo(20, y);
        ctx.lineTo(200 + x, y);
      }
      ctx.stroke();
      
      ctx.fillStyle = '#0f0';
      ctx.font = '16px monospace';
      ctx.fillText(`SYSTEM OK: ${Math.floor(time / 1000)}s`, 20, 30);
      ctx.fillText(`O2 LEVEL: ${Math.floor(Math.sin(time * 0.001) * 10 + 90)}%`, 20, 240);
    };

    const drawRadar = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 256, 256);
      
      const mapW = map[0].length;
      const mapH = map.length;
      const scaleX = 256 / mapW;
      const scaleY = 256 / mapH;
      
      // Draw map outline
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 1;
      map.forEach((row, z) => {
        row.forEach((tile, x) => {
          if (tile !== TileType.EMPTY && tile !== TileType.VENT && tile !== TileType.KEY && tile !== TileType.SERVICE_TUNNEL) {
            ctx.strokeRect(x * scaleX, z * scaleY, scaleX, scaleY);
          }
        });
      });
      
      // Draw enemies
      ctx.fillStyle = '#f00';
      enemiesRef.current.forEach(enemy => {
        ctx.beginPath();
        ctx.arc(enemy.pos.x * scaleX + scaleX/2, enemy.pos.z * scaleY + scaleY/2, scaleX/4, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw player
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(logicalPos.current.x * scaleX + scaleX/2, logicalPos.current.z * scaleY + scaleY/2, scaleX/3, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawLamps = (ctx: CanvasRenderingContext2D, time: number) => {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, 256, 256);
      
      const rows = 8;
      const cols = 8;
      const spacing = 256 / 8;
      
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const seed = r * cols + c;
          const blink = Math.sin(time * 0.005 + seed * 1.5) > 0.5;
          
          if (blink) {
            const colorSeed = (seed + Math.floor(time * 0.001)) % 3;
            if (colorSeed === 0) ctx.fillStyle = '#ff0000';
            else if (colorSeed === 1) ctx.fillStyle = '#00ff00';
            else ctx.fillStyle = '#ffff00';
          } else {
            ctx.fillStyle = '#222';
          }
          
          ctx.beginPath();
          ctx.arc(c * spacing + spacing/2, r * spacing + spacing/2, 8, 0, Math.PI * 2);
          ctx.fill();
          
          // Add a small glow
          if (blink) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.fillStyle as string;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      }
    };

    map.forEach((row, z) => {
      row.forEach((tile, x) => {
        const xPos = x * TILE_SIZE;
        const zPos = z * TILE_SIZE;
        const key = `${x},${z}`;

        const floorGeo = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
        
        // Floor
        if (tile !== TileType.SERVICE_TUNNEL) {
          const floor = new THREE.Mesh(floorGeo, floorMat);
          floor.rotation.x = -Math.PI / 2;
          floor.position.set(xPos, -2, zPos);
          scene.add(floor);
        }

        // Ceiling
        const ceiling = new THREE.Mesh(floorGeo, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(xPos, 2, zPos);
        scene.add(ceiling);

        // Wall/Obstacle logic
        let mesh: THREE.Object3D | null = null;
        
        // Add "twist" to geometry
        const twistX = (Math.random() - 0.5) * 0.1;
        const twistZ = (Math.random() - 0.5) * 0.1;
        const twistRot = (Math.random() - 0.5) * 0.05;

        switch (tile) {
          case TileType.WALL:
            const wallGeo = new THREE.BoxGeometry(TILE_SIZE, 4, TILE_SIZE);
            mesh = new THREE.Mesh(wallGeo, wallMat);
            break;
          case TileType.PILLAR:
            mesh = createPillarGeometry();
            break;
          case TileType.ANGLED_WALL:
            mesh = createAngledWallGeometry();
            break;
          case TileType.WINDOW_WALL:
            mesh = createWindowWallGeometry();
            break;
          case TileType.VENT:
            const vent = createVentGeometry();
            vent.position.set(xPos, -1.95, zPos);
            scene.add(vent);
            // Light from below
            const ventLight = new THREE.PointLight(0x00ff88, 1, 3);
            ventLight.position.set(xPos, -1.8, zPos);
            scene.add(ventLight);
            break;
          case TileType.OBSTACLE:
            mesh = createObstacleGeometry();
            break;
          case TileType.KEY:
            mesh = createKeyGeometry();
            break;
          case TileType.BARRICADE:
            mesh = createBarricadeGeometry();
            break;
          case TileType.BOX:
            mesh = createBoxGeometry();
            break;
          case TileType.LIGHT_BOTTOM:
          case TileType.LIGHT_MIDDLE:
          case TileType.DISPLAY_WALL:
          case TileType.RADAR_WALL:
            // Add wall base
            const wallBase = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE, 4, TILE_SIZE), wallMat);
            wallBase.position.set(xPos, 0, zPos);
            scene.add(wallBase);

            // Check neighbors to place fixtures on visible faces
            const neighbors = [
              { dx: 0, dz: 1, rot: 0, pos: [0, 0, 2.01] },       // Front (+Z)
              { dx: 0, dz: -1, rot: Math.PI, pos: [0, 0, -2.01] }, // Back (-Z)
              { dx: 1, dz: 0, rot: Math.PI / 2, pos: [2.01, 0, 0] }, // Right (+X)
              { dx: -1, dz: 0, rot: -Math.PI / 2, pos: [-2.01, 0, 0] } // Left (-X)
            ];

            let lightAdded = false;

            neighbors.forEach(n => {
              const nx = x + n.dx;
              const nz = z + n.dz;
              // If neighbor is empty or a non-wall tile, place fixture on this face
              if (nz >= 0 && nz < map.length && nx >= 0 && nx < map[0].length) {
                const nTile = map[nz][nx];
                if (nTile === TileType.EMPTY || nTile === TileType.VENT || nTile === TileType.KEY || nTile === TileType.SERVICE_TUNNEL) {
                  if (tile === TileType.DISPLAY_WALL || tile === TileType.RADAR_WALL || tile === TileType.LAMP_WALL) {
                    const screenGeo = new THREE.PlaneGeometry(2, 2);
                    const screenMat = new THREE.MeshBasicMaterial({ 
                      map: tile === TileType.DISPLAY_WALL ? displayTexture : (tile === TileType.RADAR_WALL ? radarTexture : lampTexture)
                    });
                    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
                    screenMesh.position.set(xPos + n.pos[0], 0.5, zPos + n.pos[2]);
                    screenMesh.rotation.y = n.rot;
                    scene.add(screenMesh);

                    if (!lightAdded) {
                      const color = tile === TileType.DISPLAY_WALL ? 0x00ff00 : (tile === TileType.RADAR_WALL ? 0x00ffff : 0xffff00);
                      const pLight = new THREE.PointLight(color, 5, 10);
                      pLight.position.set(xPos + n.pos[0] * 0.9, 0.5, zPos + n.pos[2] * 0.9);
                      scene.add(pLight);
                      lightsRef.current[key] = pLight;
                      lightAdded = true;
                    }
                  } else {
                    const isBottom = tile === TileType.LIGHT_BOTTOM;
                    const fixture = createLightFixtureGeometry(isBottom ? 'bottom' : 'middle');
                    fixture.position.set(xPos + n.pos[0] * 0.98, isBottom ? -1.5 : 0, zPos + n.pos[2] * 0.98);
                    fixture.rotation.y = n.rot;
                    scene.add(fixture);
                    
                    if (!lightAdded) {
                      const pLight = new THREE.PointLight(0xffffff, isBottom ? 5 : 8, 10);
                      pLight.position.set(xPos + n.pos[0] * 0.9, isBottom ? -1.5 : 0, zPos + n.pos[2] * 0.9);
                      scene.add(pLight);
                      lightsRef.current[key] = pLight;
                      lightAdded = true;
                    }
                  }
                }
              }
            });
            mesh = null;
            break;
          case TileType.SEGMENTED_WALL:
            mesh = createSegmentedWallGeometry();
            // Rotate to face empty space
            const sNeighbors = [
              { dx: 0, dz: 1, rot: 0 },
              { dx: 0, dz: -1, rot: Math.PI },
              { dx: 1, dz: 0, rot: Math.PI / 2 },
              { dx: -1, dz: 0, rot: -Math.PI / 2 }
            ];
            for (const n of sNeighbors) {
              const nx = x + n.dx;
              const nz = z + n.dz;
              if (nz >= 0 && nz < map.length && nx >= 0 && nx < map[0].length) {
                if (map[nz][nx] === TileType.EMPTY || map[nz][nx] === TileType.SERVICE_PATH_STRAIGHT || map[nz][nx] === TileType.SERVICE_PATH_JUNCTION) {
                  mesh.rotation.y = n.rot;
                  break;
                }
              }
            }
            break;
          case TileType.VERTICALLY_SEGMENTED_WALL:
            mesh = createVerticallySegmentedWallGeometry();
            // Rotate to face empty space
            const vNeighbors = [
              { dx: 0, dz: 1, rot: 0 },
              { dx: 0, dz: -1, rot: Math.PI },
              { dx: 1, dz: 0, rot: Math.PI / 2 },
              { dx: -1, dz: 0, rot: -Math.PI / 2 }
            ];
            for (const n of vNeighbors) {
              const nx = x + n.dx;
              const nz = z + n.dz;
              if (nz >= 0 && nz < map.length && nx >= 0 && nx < map[0].length) {
                if (map[nz][nx] === TileType.EMPTY || map[nz][nx] === TileType.SERVICE_PATH_STRAIGHT || map[nz][nx] === TileType.SERVICE_PATH_JUNCTION) {
                  mesh.rotation.y = n.rot;
                  break;
                }
              }
            }
            break;
          case TileType.SERVICE_PATH_STRAIGHT:
          case TileType.SERVICE_PATH_JUNCTION:
            mesh = createServicePathGeometry(tile === TileType.SERVICE_PATH_STRAIGHT ? 'straight' : 'junction');
            if (tile === TileType.SERVICE_PATH_JUNCTION) {
              const redLight = new THREE.PointLight(0xff0000, 5, 5);
              redLight.position.set(xPos, -1.8, zPos);
              scene.add(redLight);
            }
            break;
          case TileType.BULKHEAD_DOOR:
            mesh = createBulkheadDoorGeometry();
            // Rotate to face empty space
            const dNeighbors = [
              { dx: 0, dz: 1, rot: 0 },
              { dx: 0, dz: -1, rot: Math.PI },
              { dx: 1, dz: 0, rot: Math.PI / 2 },
              { dx: -1, dz: 0, rot: -Math.PI / 2 }
            ];
            for (const n of dNeighbors) {
              const nx = x + n.dx;
              const nz = z + n.dz;
              if (nz >= 0 && nz < map.length && nx >= 0 && nx < map[0].length) {
                if (map[nz][nx] === TileType.EMPTY) {
                  mesh.rotation.y = n.rot;
                  // Move door to the edge of the tile
                  mesh.position.x += n.dx * (TILE_SIZE / 2 - 0.25);
                  mesh.position.z += n.dz * (TILE_SIZE / 2 - 0.25);
                  break;
                }
              }
            }
            break;
          case TileType.SERVICE_TUNNEL:
            mesh = createServiceTunnelGeometry();
            const tunnelLight = new THREE.PointLight(0xffff00, 5, 5);
            tunnelLight.position.set(xPos, -2, zPos);
            scene.add(tunnelLight);
            // Rotate to align with neighbors
            if ((x > 0 && map[z][x-1] === TileType.SERVICE_TUNNEL) || (x < map[0].length - 1 && map[z][x+1] === TileType.SERVICE_TUNNEL)) {
              mesh.rotation.y = Math.PI / 2;
            }
            break;
          case TileType.LAMP_WALL:
            mesh = createLampWallGeometry();
            break;
          case TileType.CEILING_LAMP:
            mesh = createCeilingLampGeometry();
            const lightC = new THREE.PointLight(0xffffff, 10, 20);
            lightC.position.set(xPos, 1.8, zPos);
            scene.add(lightC);
            lightsRef.current[key] = lightC;
            mesh.position.set(xPos, 1.9, zPos);
            scene.add(mesh);
            mesh = null;
            break;
          case TileType.DOOR:
            const doorGeo = new THREE.BoxGeometry(TILE_SIZE * 0.8, 4, 0.5);
            const doorMat = new THREE.MeshStandardMaterial({ color: 0x884444 });
            mesh = new THREE.Mesh(doorGeo, doorMat);
            break;
        }

        if (mesh) {
          mesh.position.x += xPos + twistX;
          mesh.position.z += zPos + twistZ;
          mesh.rotation.y += twistRot;
          scene.add(mesh);
        }
      });
    });

    // Water effect mesh
    const waterGeo = new THREE.PlaneGeometry(100, 100);
    const waterMat = new THREE.MeshStandardMaterial({ 
      color: 0x0044ff, 
      transparent: true, 
      opacity: 0.2,
      metalness: 0.9,
      roughness: 0.1
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -1.5;
    water.visible = false;
    scene.add(water);

    const animate = () => {
      requestAnimationFrame(animate);

      // Smooth movement
      currentPos.current.lerp(targetPos.current, 0.1);
      
      // Handle rotation wrapping for smooth lerp
      let rotDiff = targetRot.current - currentRot.current;
      while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
      currentRot.current += rotDiff * 0.1;

      if (playerRef.current) {
        playerRef.current.position.copy(currentPos.current);
        playerRef.current.rotation.y = currentRot.current;
      }

      if (camera) {
        // Automatic defense logic: check if near barricade or box
        const { x: px, z: pz } = logicalPos.current;
        const neighbors = [
          { x: px + 1, z: pz }, { x: px - 1, z: pz },
          { x: px, z: pz + 1 }, { x: px, z: pz - 1 }
        ];
        const isNearCover = neighbors.some(n => {
          const tile = map[n.z]?.[n.x];
          return tile === TileType.BARRICADE || tile === TileType.BOX;
        });

        // Update defense state automatically
        if (isNearCover !== isDefendingRef.current) {
          isDefendingRef.current = isNearCover;
          setGameState(prev => ({ ...prev, isDefending: isNearCover }));
        }

        // Explicitly follow player's interpolated position and rotation
        camera.position.copy(currentPos.current);
        camera.rotation.y = currentRot.current;

        // Apply backward offset
        const rpx = Math.round(logicalPos.current.x);
        const rpz = Math.round(logicalPos.current.z);
        const tile = map[rpz]?.[rpx];
        const isServicePath = tile === TileType.SERVICE_PATH_STRAIGHT || tile === TileType.SERVICE_PATH_JUNCTION;
        
        const backwardOffset = isServicePath ? 0 : (isMobileRef.current ? 1.2 : 0.8);
        camera.position.x += Math.sin(currentRot.current) * backwardOffset;
        camera.position.z += Math.cos(currentRot.current) * backwardOffset;

        // Apply vertical offset for defense (ducking) or attack (standing up)
        let yOffset = 0;
        if (isAttackingRef.current) {
          yOffset = 0.5; // Raise camera when shooting
        } else if (isDefendingRef.current) {
          yOffset = -0.8; // Lower camera when hiding
        }
        
        camera.position.y += yOffset;
        
        // Apply environmental effects (wobble/shake)
        const time = Date.now() * 0.001;
        
        if (envEffectRef.current === 'vacuum') {
          camera.position.x += (Math.random() - 0.5) * 0.2;
          camera.position.z += (Math.random() - 0.5) * 0.2;
        } else {
          camera.position.x += Math.sin(time * 2) * 0.02;
        }

        if (envEffectRef.current === 'water') {
          water.visible = true;
          water.position.y = -1.5 + Math.sin(time) * 0.1;
        } else {
          water.visible = false;
        }
      }

      // Update enemies
      enemiesRef.current.forEach(enemy => {
        enemy.mesh.position.x = THREE.MathUtils.lerp(enemy.mesh.position.x, enemy.pos.x * TILE_SIZE, 0.05);
        enemy.mesh.position.z = THREE.MathUtils.lerp(enemy.mesh.position.z, enemy.pos.z * TILE_SIZE, 0.05);
        enemy.mesh.rotation.y += 0.02;
        if (enemy.type === EnemyType.SWARM) {
          enemy.mesh.position.y = -0.5 + Math.sin(Date.now() * 0.005) * 0.2;
        }
      });

      // Update overclocked lights
      Object.entries(lightsRef.current).forEach(([key, light]) => {
        const [kx, kz] = key.split(',').map(Number);
        const tileKey = `${kx},${kz}`;
        const l = light as THREE.PointLight;
        const tile = map[kz][kx];
        const baseIntensity = tile === TileType.CEILING_LAMP ? 10 : (tile === TileType.LIGHT_MIDDLE ? 8 : (tile === TileType.DISPLAY_WALL || tile === TileType.RADAR_WALL ? 5 : 5));

        if (overclockedTilesRef.current.has(tileKey)) {
          l.intensity = baseIntensity * 10 + Math.sin(Date.now() * 0.05) * 20;
          l.color.setHex(0xffffff);
        } else {
          if (tile === TileType.LIGHT_BOTTOM) l.intensity = 5;
          else if (tile === TileType.LIGHT_MIDDLE) l.intensity = 8;
          else if (tile === TileType.CEILING_LAMP) l.intensity = 10;
          else if (tile === TileType.DISPLAY_WALL) {
            l.intensity = 5;
            l.color.setHex(0x00ff00);
          } else if (tile === TileType.RADAR_WALL) {
            l.intensity = 5;
            l.color.setHex(0x00ffff);
          }
        }
      });

      // Update projectiles
      if (projectilesRef.current.length > 0) {
        const toRemove: string[] = [];
        projectilesRef.current.forEach((proj) => {
          const speed = 0.5;
          proj.pos.add(proj.dir.clone().multiplyScalar(speed));
          proj.mesh.position.copy(proj.pos);
          
          let hit = false;
          // Check for collisions with enemies
          enemiesRef.current.forEach(enemy => {
            const dist = proj.pos.distanceTo(new THREE.Vector3(enemy.pos.x * TILE_SIZE, 0, enemy.pos.z * TILE_SIZE));
            if (dist < 1) {
              hit = true;
            }
          });

          // Remove if too far or hit
          if (hit || proj.pos.length() > 100) {
            if (sceneRef.current) sceneRef.current.remove(proj.mesh);
            toRemove.push(proj.id);
          }
        });

        if (toRemove.length > 0) {
          setProjectiles(prev => prev.filter(p => !toRemove.includes(p.id)));
        }
      }

      // Update display animation (only if near a display wall to save performance)
      const dpx = Math.round(logicalPos.current.x);
      const dpz = Math.round(logicalPos.current.z);
      let nearDisplay = false;
      let nearRadar = false;
      let nearLamps = false;

      // Check 3x3 area around player for displays
      for (let dz = -3; dz <= 3; dz++) {
        for (let dx = -3; dx <= 3; dx++) {
          const tx = dpx + dx;
          const tz = dpz + dz;
          if (tz >= 0 && tz < map.length && tx >= 0 && tx < map[0].length) {
            const tile = map[tz][tx];
            if (tile === TileType.DISPLAY_WALL) nearDisplay = true;
            if (tile === TileType.RADAR_WALL) nearRadar = true;
            if (tile === TileType.LAMP_WALL) nearLamps = true;
          }
        }
      }

      if (displayCtxRef.current && nearDisplay) {
        draw(displayCtxRef.current, Date.now());
        displayTexture.needsUpdate = true;
      }

      if (lampCtxRef.current && nearLamps) {
        drawLamps(lampCtxRef.current, Date.now());
        lampTexture.needsUpdate = true;
      }

      // Update radar animation
      if (radarCtxRef.current && nearRadar) {
        drawRadar(radarCtxRef.current);
        radarTexture.needsUpdate = true;
      }

      renderer.render(scene, camera);

      // Dynamic Ambient Light
      if (ambientLightRef.current) {
        const px = Math.round(logicalPos.current.x);
        const pz = Math.round(logicalPos.current.z);
        const tile = map[pz]?.[px];
        
        let targetIntensity = 0.4; // Medium (Room)
        if (tile === TileType.SERVICE_PATH_STRAIGHT || tile === TileType.SERVICE_PATH_JUNCTION) {
          targetIntensity = 0.01; // Dark (Pathway)
        } else if (tile === TileType.SERVICE_TUNNEL) {
          targetIntensity = 0.3; // Slightly brighter than service path due to yellow glow
        } else if (map.length > 9 && pz >= 1 && pz <= 2) { // Corridor in Level 2
          targetIntensity = 1.5; // Bright (Corridor)
        }
        
        ambientLightRef.current.intensity += (targetIntensity - ambientLightRef.current.intensity) * 0.05;
        
        if (fogRef.current) {
          const fogColor = new THREE.Color(0x050505).multiplyScalar(ambientLightRef.current.intensity * 0.5);
          fogRef.current.color.copy(fogColor);
          scene.background = fogColor;
        }
      }
    };

    let animationId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, [map]);

  // Enemy AI and Spawning
  useEffect(() => {
    if (isGameOver) return;
    const spawnTimer = setInterval(() => {
      if (enemies.length < 5) {
        // Find a vent or random empty spot
        const vents: {x: number, z: number}[] = [];
        map.forEach((row, z) => row.forEach((tile, x) => {
          if (tile === TileType.VENT) vents.push({x, z});
        }));
        
        const spawnPos = vents.length > 0 ? vents[Math.floor(Math.random() * vents.length)] : {x: 5, z: 5};
        
        const type = Math.random() > 0.5 ? EnemyType.DRONE : EnemyType.SWARM;
        const mesh = type === EnemyType.DRONE ? createDroneMesh() : createSwarmMesh();
        mesh.position.set(spawnPos.x * TILE_SIZE, 0, spawnPos.z * TILE_SIZE);
        if (sceneRef.current) sceneRef.current.add(mesh);
        
        const newEnemy: Enemy = {
          id: Math.random().toString(),
          type,
          pos: spawnPos,
          mesh,
          hp: type === EnemyType.DRONE ? 30 : 15
        };
        setEnemies(prev => [...prev, newEnemy]);
      }
    }, 8000);

    const moveTimer = setInterval(() => {
      setEnemies(prev => prev.map(enemy => {
        const dx = Math.floor(Math.random() * 3) - 1;
        const dz = Math.floor(Math.random() * 3) - 1;
        const nx = enemy.pos.x + dx;
        const nz = enemy.pos.z + dz;
        
        if (!checkCollision(nx, nz)) {
          // Check if player is there using logical position
          if (nx === logicalPos.current.x && nz === logicalPos.current.z) {
            // Attack player
            setGameState(p => {
              const damage = enemy.type === EnemyType.DRONE ? 10 : 5;
              const finalDamage = p.isDefending ? damage * 0.2 : damage;
              const newHp = Math.max(0, p.stats.hp - finalDamage);
              if (newHp === 0) setIsGameOver(true);
              return { ...p, stats: { ...p.stats, hp: newHp } };
            });
            return enemy;
          }
          return { ...enemy, pos: { x: nx, z: nz } };
        }
        return enemy;
      }));
    }, 2000);

    return () => {
      clearInterval(spawnTimer);
      clearInterval(moveTimer);
    };
  }, [enemies.length, isGameOver, map]);

  // Oxygen depletion
  useEffect(() => {
    const timer = setInterval(() => {
      setGameState(prev => {
        const newOxy = Math.max(0, prev.stats.oxygen - 0.5);
        if (newOxy === 0) {
          // Damage if no oxygen
          const newHp = Math.max(0, prev.stats.hp - 1);
          return { ...prev, stats: { ...prev.stats, oxygen: newOxy, hp: newHp } };
        }
        return { ...prev, stats: { ...prev.stats, oxygen: newOxy } };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-mono text-emerald-500 select-none touch-none">
      <div ref={containerRef} className="absolute inset-0" />

      {/* HUD */}
      <div className="absolute top-0 left-0 w-full p-4 pointer-events-none flex justify-between items-start">
        <div className="flex flex-col gap-2 bg-black/40 backdrop-blur-md p-4 rounded-xl border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-red-500" />
            <div className="w-20 sm:w-32 h-2 bg-red-950 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-red-500"
                initial={{ width: '100%' }}
                animate={{ width: `${(gameState.stats.hp / gameState.stats.maxHp) * 100}%` }}
              />
            </div>
            <span className="text-xs">{Math.ceil(gameState.stats.hp)}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Wind className="w-5 h-5 text-cyan-400" />
            <div className="w-20 sm:w-32 h-2 bg-cyan-950 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-cyan-400"
                initial={{ width: '100%' }}
                animate={{ width: `${(gameState.stats.oxygen / gameState.stats.maxOxygen) * 100}%` }}
              />
            </div>
            <span className="text-xs">{Math.ceil(gameState.stats.oxygen)}%</span>
          </div>

          <div className="flex gap-4 mt-2 text-[10px] uppercase tracking-widest opacity-70">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" /> STR: {gameState.stats.strength}
            </div>
            <div className="flex items-center gap-1">
              <Crosshair className="w-3 h-3" /> GUN: {gameState.stats.firearm}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-xs opacity-50">LOCATION</div>
            <div className="text-lg font-bold tracking-tighter">SECTOR {gameState.playerPos.x}-{gameState.playerPos.z}</div>
          </div>
          {gameState.isDefending && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-400/50 text-xs font-bold"
            >
              <Shield className="w-4 h-4" /> DEFENSE ACTIVE
            </motion.div>
          )}
          {envEffect !== 'none' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-400/50 text-xs font-bold"
            >
              <AlertTriangle className="w-4 h-4" /> {envEffect.toUpperCase()} WARNING
            </motion.div>
          )}
        </div>
      </div>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-center p-10"
          >
            <Skull className="w-24 h-24 text-red-500 mb-6" />
            <h1 className="text-5xl font-black text-red-500 mb-4 tracking-tighter">SIGNAL LOST</h1>
            <p className="text-red-400/70 mb-8 max-w-md">The vessel has been compromised. Life support systems offline. Mission failed.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-red-500 text-black font-bold rounded-full hover:bg-red-400 transition-colors"
            >
              REBOOT SYSTEM
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enemy Arrows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {enemies.map(enemy => {
          const dx = enemy.pos.x - currentPos.current.x / TILE_SIZE;
          const dz = enemy.pos.z - currentPos.current.z / TILE_SIZE;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > 5) return null; // Only show nearby

          // Angle to enemy in world space
          const angleToEnemy = Math.atan2(dx, dz);
          
          // Use visual rotation for smoother arrow movement
          const playerAngle = currentRot.current;

          const relativeAngle = playerAngle - angleToEnemy;
          
          // If enemy is roughly in front, don't show arrow
          if (Math.abs(relativeAngle) < Math.PI / 4 || Math.abs(relativeAngle) > 7 * Math.PI / 4) return null;

          return (
            <div 
              key={enemy.id}
              className="absolute w-6 h-6 text-red-500/50"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotate(${relativeAngle}rad) translateY(-200px)`
              }}
            >
              <ArrowUp className="w-full h-full" />
            </div>
          );
        })}
      </div>

      {/* Center Reticle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
        <div className="w-8 h-8 border border-emerald-500/50 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-emerald-500 rounded-full" />
        </div>
      </div>

      {/* Interaction Message */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-black/80 border border-emerald-500/50 px-6 py-3 rounded-lg text-sm"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Controls */}
      {isMobile && (
        <div className="absolute bottom-0 left-0 w-full p-6 flex justify-between items-end pointer-events-none z-50">
          <div className="grid grid-cols-3 gap-2 pointer-events-auto">
            <button 
              onPointerDown={(e) => { e.preventDefault(); rotate(false); }} 
              className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center justify-center active:bg-emerald-500/40 touch-none select-none"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
            <button 
              onPointerDown={(e) => { e.preventDefault(); move(true); }} 
              className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center justify-center active:bg-emerald-500/40 touch-none select-none"
            >
              <MoveUp className="w-6 h-6" />
            </button>
            <button 
              onPointerDown={(e) => { e.preventDefault(); rotate(true); }} 
              className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center justify-center active:bg-emerald-500/40 touch-none select-none"
            >
              <RotateCw className="w-6 h-6" />
            </button>

            <button 
              onPointerDown={(e) => { e.preventDefault(); strafe(false); }} 
              className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center justify-center active:bg-emerald-500/40 touch-none select-none"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onPointerDown={(e) => { e.preventDefault(); move(false); }} 
              className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center justify-center active:bg-emerald-500/40 touch-none select-none"
            >
              <MoveDown className="w-6 h-6" />
            </button>
            <button 
              onPointerDown={(e) => { e.preventDefault(); strafe(true); }} 
              className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center justify-center active:bg-emerald-500/40 touch-none select-none"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col gap-4 pointer-events-auto">
            <button 
              onPointerDown={(e) => { e.preventDefault(); toggleDefense(); }} 
              onPointerUp={(e) => { e.preventDefault(); toggleDefense(); }}
              className={`w-16 h-16 rounded-full border flex items-center justify-center transition-colors touch-none select-none ${gameState.isDefending ? 'bg-blue-500 border-blue-400' : 'bg-blue-500/20 border-blue-500/50'}`}
            >
              <Shield className="w-8 h-8 text-white" />
            </button>
            <button 
              onPointerDown={(e) => { e.preventDefault(); attack(); }}
              className="w-16 h-16 bg-red-500/20 border border-red-500/50 rounded-full flex items-center justify-center active:bg-red-500/40 touch-none select-none"
            >
              <Crosshair className="w-8 h-8 text-red-500" />
            </button>
            <button 
              onPointerDown={(e) => { e.preventDefault(); interact(); }}
              className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center active:bg-emerald-500/40 touch-none select-none"
            >
              <Hand className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Instructions */}
      {!isMobile && (
        <div className="absolute bottom-4 left-4 text-[10px] opacity-30 pointer-events-none uppercase tracking-widest flex gap-6">
          <span>WASD: MOVE/ROTATE</span>
          <span>SPACE/R: ATTACK</span>
          <span>F: INTERACT</span>
          <span>SHIFT: DEFEND</span>
        </div>
      )}

      {/* Screen Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        <div className="w-full h-full opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>
    </div>
  );
}
