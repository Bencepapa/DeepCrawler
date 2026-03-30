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
  LEVEL_2_MAP,
  LEVELS,
  TILE_PROPERTIES
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
  createServiceTunnelGeometry,
  createNeonTubeGeometry,
  createNeonCornerWallGeometry,
  createVaporwaveFloorGeometry,
  createGlowPlane,
  createPosterGeometry,
  createHullBreachGeometry,
  createBulletImpactGeometry,
  createClawMarkGeometry,
  createCrackGeometry,
  createBulletShellGeometry,
  createSmudgeGeometry
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
  const lightsRef = useRef<Array<{ light: THREE.PointLight; x: number; z: number; tile: TileType; radius?: number; intensity?: number }>>([]);
  const lightOverrides = useRef<Record<string, { radius?: number; intensity?: number }>>({});
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const fogRef = useRef<THREE.Fog | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const radarCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lampCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lightMapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lightMapCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const tempLightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tempLightCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const debugCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    playerPos: { x: 5, z: 5 },
    playerDir: Direction.EAST,
    stats: INITIAL_STATS,
    isDefending: false,
    decals: [],
    cleanupProgress: 0,
    totalMess: 0,
    isQuarantineActive: true,
    isQuarantineBypassed: false,
  });
  const gameStateRef = useRef<GameState>(gameState);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const [levelName, setLevelName] = useState("SUB-DECK 4: MAINTENANCE");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionLevelName, setTransitionLevelName] = useState("");

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
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [isDebugViewOpen, setIsDebugViewOpen] = useState(false);
  const isDebugViewOpenRef = useRef(false);
  const [renderScale, setRenderScale] = useState(1);
  const renderScaleRef = useRef(1);
  const [isLightmapActive, setIsLightmapActive] = useState(LEVELS[1].lightmapEnabled);
  const isLightmapActiveRef = useRef(LEVELS[1].lightmapEnabled);
  const [hasKey, setHasKey] = useState(false);
  const [overclockedTiles, setOverclockedTiles] = useState<Set<string>>(new Set());
  const overclockedTilesRef = useRef<Set<string>>(new Set());
  const frameCounterRef = useRef(0);

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

  useEffect(() => {
    isLightmapActiveRef.current = isLightmapActive;
  }, [isLightmapActive]);

  useEffect(() => {
    isDebugViewOpenRef.current = isDebugViewOpen;
  }, [isDebugViewOpen]);

  useEffect(() => {
    renderScaleRef.current = renderScale;
    if (rendererRef.current && cameraRef.current) {
      const width = window.innerWidth / renderScale;
      const height = window.innerHeight / renderScale;
      rendererRef.current.setSize(width, height, false);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      // Update canvas style for sharp upscaling
      const canvas = rendererRef.current.domElement;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.imageRendering = renderScale > 1 ? 'pixelated' : 'auto';
    }
  }, [renderScale]);

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

  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  }, []);

  const checkCollision = useCallback((x: number, z: number) => {
    if (x < 0 || x >= map[0].length || z < 0 || z >= map.length) return true;
    const tile = map[z][x];
    const props = TILE_PROPERTIES[tile];
    return props ? !props.walkable : true;
  }, [map]);

  const move = useCallback((forward: boolean) => {
    if (isGameOver || isTransitioning) return;
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
    const props = TILE_PROPERTIES[targetTile];

    if (props?.canJumpOver && !props?.walkable) {
      // Jump over obstacle: move 2 tiles forward
      const jumpX = logicalPos.current.x + dx * 2;
      const jumpZ = logicalPos.current.z + dz * 2;
      
      if (!checkCollision(jumpX, jumpZ)) {
        logicalPos.current = { x: jumpX, z: jumpZ };
        targetPos.current.set(jumpX * TILE_SIZE, 0, jumpZ * TILE_SIZE);
        setGameState(prev => ({ ...prev, playerPos: { x: jumpX, z: jumpZ } }));
        showMessage(`JUMPED OVER ${TILE_DESCRIPTIONS[targetTile] || "OBSTACLE"}`);
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

      const props = TILE_PROPERTIES[map[nextZ][nextX]];
      const isLowObstacle = props?.canJumpOver;
      targetPos.current.set(nextX * TILE_SIZE, isLowObstacle ? 0.5 : 0, nextZ * TILE_SIZE);
      setGameState(prev => ({ ...prev, playerPos: { x: nextX, z: nextZ } }));
    } else {
      console.log('Collision detected at:', nextX, nextZ);
    }
  }, [checkCollision, isGameOver, isTransitioning, map, showMessage]);

  const rotate = useCallback((clockwise: boolean) => {
    if (isGameOver || isTransitioning) return;
    console.log('Rotate requested:', clockwise ? 'clockwise' : 'counter-clockwise');
    
    const nextDir = clockwise ? (logicalDir.current + 1) % 4 : (logicalDir.current + 3) % 4;
    logicalDir.current = nextDir;
    
    // Update visual target rotation synchronously with logical direction
    targetRot.current += clockwise ? -Math.PI / 2 : Math.PI / 2;
    
    setGameState(prev => ({ ...prev, playerDir: nextDir }));
  }, [isGameOver, isTransitioning]);

  const strafe = useCallback((right: boolean) => {
    if (isGameOver || isTransitioning) return;
    
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

      const props = TILE_PROPERTIES[map[nextZ][nextX]];
      const isLowObstacle = props?.canJumpOver;
      targetPos.current.set(nextX * TILE_SIZE, isLowObstacle ? 0.5 : 0, nextZ * TILE_SIZE);
      setGameState(prev => ({ ...prev, playerPos: { x: nextX, z: nextZ } }));
    }
  }, [checkCollision, isGameOver, isTransitioning, map, showMessage]);

  const handleUse = useCallback(() => {
    if (isGameOver || isTransitioning) return;
    const { x: px, z: pz } = logicalPos.current;
    const dir = logicalDir.current;
    let tx = px;
    let tz = pz;
    
    if (dir === Direction.NORTH) tz -= 1;
    else if (dir === Direction.SOUTH) tz += 1;
    else if (dir === Direction.EAST) tx += 1;
    else if (dir === Direction.WEST) tx -= 1;
    
    const tile = map[tz]?.[tx];
    const props = TILE_PROPERTIES[tile];

    // Check for quarantine bypass
    if (tile === TileType.QUARANTINE_DISPLAY) {
      setGameState(prev => ({ ...prev, isQuarantineBypassed: true }));
      showMessage("QUARANTINE BYPASSED");
      return;
    }

    // Check for decals to clean/fix
    const decalIndex = gameState.decals.findIndex(d => 
      Math.abs(d.pos.x - tx) < 0.7 && Math.abs(d.pos.z - tz) < 0.7 && !d.cleaned
    );

    if (decalIndex !== -1) {
      const decal = gameState.decals[decalIndex];
      let cleaned = false;
      let msg = "";

      if (decal.type === 'SMUDGE' || decal.type === 'HULL_BREACH') {
        const newDecals = [...gameState.decals];
        const currentSize = newDecals[decalIndex].size || 1;
        if (currentSize > 0.2) {
          newDecals[decalIndex].size = currentSize - 0.2;
          msg = decal.type === 'SMUDGE' ? "CLEANING SMUDGE..." : "REPAIRING HULL BREACH...";
        } else {
          newDecals[decalIndex].cleaned = true;
          cleaned = true;
          msg = decal.type === 'SMUDGE' ? "SMUDGE CLEANED" : "HULL BREACH REPAIRED";
        }
        
        if (!cleaned) {
          setGameState(prev => ({ ...prev, decals: newDecals }));
          showMessage(msg);
          return;
        }
      } else if (decal.type === 'POSTER') {
        cleaned = true;
        msg = "POSTER REMOVED";
      }

      if (cleaned) {
        const newDecals = [...gameState.decals];
        newDecals[decalIndex].cleaned = true;
        
        // Remove from scene
        if (sceneRef.current) {
          const obj = sceneRef.current.getObjectByName(newDecals[decalIndex].id);
          if (obj) sceneRef.current.remove(obj);
        }

        const activeMess = newDecals.filter(d => !d.cleaned && (d.type === 'HULL_BREACH' || d.type === 'SMUDGE')).length;

        setGameState(prev => ({
          ...prev,
          decals: newDecals,
          cleanupProgress: prev.cleanupProgress + 1,
          isQuarantineActive: activeMess > 0
        }));
        
        if (activeMess === 0) {
          showMessage("QUARANTINE LIFTED: ALL CRITICAL MESS CLEARED");
        } else {
          showMessage(`${msg}. ${activeMess} CRITICAL ITEMS REMAINING.`);
        }
        return;
      }
    }

    if (props?.openable) {
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
      } else if (tile === TileType.BULKHEAD_DOOR) {
        if (gameState.isQuarantineActive && !gameState.isQuarantineBypassed) {
          const activeMess = gameState.decals.filter(d => !d.cleaned && (d.type === 'HULL_BREACH' || d.type === 'SMUDGE')).length;
          showMessage(`QUARANTINE ACTIVE: ${activeMess} CRITICAL MESSES REMAINING. BYPASS AT TERMINAL OR CLEAN UP.`);
          return;
        }
        const nextLevelId = currentLevelId === 1 ? 2 : 3;
        setTransitionLevelName(LEVELS[nextLevelId].name);
        setIsTransitioning(true);
        
        setTimeout(() => {
          // Reset player state for new level
          logicalPos.current = { x: 1, z: 1 };
          logicalDir.current = Direction.EAST;
          targetRot.current = -Math.PI / 2;
          currentRot.current = -Math.PI / 2;
          currentPos.current.set(1 * TILE_SIZE, 0, 1 * TILE_SIZE);
          targetPos.current.set(1 * TILE_SIZE, 0, 1 * TILE_SIZE);
          
          setCurrentLevelId(nextLevelId);
          setMap(LEVELS[nextLevelId].map);
          setIsLightmapActive(LEVELS[nextLevelId].lightmapEnabled);
          setLevelName(LEVELS[nextLevelId].name);
          setEnemies([]);
          setGameState(prev => ({ 
            ...prev, 
            playerPos: { x: 1, z: 1 },
            playerDir: Direction.EAST
          }));
          
          setTimeout(() => {
            setIsTransitioning(false);
          }, 1500);
        }, 2000);
      }
    } else if (tile === TileType.VENT && props?.destroyable) {
      if (Math.random() > 0.5) {
        setEnvEffect('vacuum');
        showMessage("CRITICAL: HULL BREACH DETECTED!");
        setTimeout(() => setEnvEffect('none'), 3000);
      } else {
        showMessage("Vent is sealed tight.");
      }
    } else if (props?.canJumpOver) {
      showMessage(TILE_DESCRIPTIONS[tile] || "A low obstacle. You can jump over it.");
    } else if (tile === TileType.WINDOW_WALL) {
      setEnvEffect('water');
      showMessage("Observing the deep ocean...");
      setTimeout(() => setEnvEffect('none'), 5000);
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
  }, [isGameOver, isTransitioning, hasKey, map, showMessage, gameState.decals, gameState.isQuarantineActive, gameState.isQuarantineBypassed, currentLevelId]);

  const attack = useCallback(() => {
    if (isGameOver || isTransitioning) return;
    
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
  }, [gameState.stats.firearm, isGameOver, isTransitioning]);

  const toggleDefense = useCallback(() => {
    setGameState(prev => ({ ...prev, isDefending: !prev.isDefending }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || isGameOver || isTransitioning) return;
      if (e.key === 'F10') {
        if (e.shiftKey) {
          setIsLightmapActive(prev => !prev);
        } else {
          setIsDebugViewOpen(prev => !prev);
        }
        return;
      }
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': move(true); break;
        case 's': case 'arrowdown': move(false); break;
        case 'a': strafe(false); break;
        case 'd': strafe(true); break;
        case 'q': case 'arrowleft': rotate(false); break;
        case 'e': case 'arrowright': rotate(true); break;
        case 'f': handleUse(); break;
        case ' ': attack(); break;
        case 'r': attack(); break;
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
  }, [isGameOver, isTransitioning, move, rotate, handleUse, attack, toggleDefense]);

  // Three.js Setup
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous scene if any
    while(containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // Clear previous state
    lightsRef.current = [];
    enemiesRef.current = [];
    projectilesRef.current = [];
    overclockedTilesRef.current = new Set();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    const fog = new THREE.Fog(0x050505, 2, 15);
    scene.fog = fog;
    fogRef.current = fog;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(isMobileRef.current ? 85 : 75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: renderScaleRef.current === 1 });
    const width = window.innerWidth / renderScaleRef.current;
    const height = window.innerHeight / renderScaleRef.current;
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(1); // Use 1 to ensure we control resolution via setSize
    
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.imageRendering = renderScaleRef.current > 1 ? 'pixelated' : 'auto';
    
    containerRef.current.appendChild(canvas);
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

    // Setup lightmap canvas
    const lightMapCanvas = document.createElement('canvas');
    const mapWidth = map[0].length;
    const mapHeight = map.length;
    lightMapCanvas.width = mapWidth * 16;
    lightMapCanvas.height = mapHeight * 16;
    const lightMapCtx = lightMapCanvas.getContext('2d');
    lightMapCanvasRef.current = lightMapCanvas;
    lightMapCtxRef.current = lightMapCtx;

    const tempLightCanvas = document.createElement('canvas');
    tempLightCanvas.width = mapWidth * 16;
    tempLightCanvas.height = mapHeight * 16;
    tempLightCanvasRef.current = tempLightCanvas;
    tempLightCtxRef.current = tempLightCanvas.getContext('2d');

    const lightMapTexture = new THREE.CanvasTexture(lightMapCanvas);
    lightMapTexture.minFilter = THREE.LinearFilter;
    lightMapTexture.magFilter = THREE.LinearFilter;
    lightMapTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // Map Generation
    const wallMat = new THREE.MeshStandardMaterial({ 
      color: 0x888888, 
      metalness: 0.2, 
      roughness: 0.8
    });

    const projectUVs = (obj: THREE.Object3D) => {
      obj.updateMatrixWorld(true);
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Skip fixtures - they have their own emissive logic
          if (child.name && (child.name.includes('fixture') || child.name.includes('light'))) return;

          const mat = child.material;
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.emissiveMap = lightMapTexture;
            mat.emissive = new THREE.Color(0xffffff);
            const isGlass = mat instanceof THREE.MeshPhysicalMaterial && mat.transparent;
            mat.emissiveIntensity = isGlass ? 0.3 : 1.5;
          }

          const geo = child.geometry;
          if (geo.attributes.position && geo.attributes.uv) {
            const pos = geo.attributes.position;
            const uv = geo.attributes.uv;
            const v3 = new THREE.Vector3();
            for (let i = 0; i < uv.count; i++) {
              v3.set(pos.getX(i), pos.getY(i), pos.getZ(i));
              child.localToWorld(v3);
              
              // Project world XZ to UV [0, 1]
              // The map starts at -TILE_SIZE/2 in world space
              const u = (v3.x + TILE_SIZE / 2) / (map[0].length * TILE_SIZE);
              // Flip V to match Canvas top-down coordinate system with flipY: true
              const v = 1 - (v3.z + TILE_SIZE / 2) / (map.length * TILE_SIZE);
              uv.setXY(i, u, v);
            }
            uv.needsUpdate = true;
          }
        }
      });
    };
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

    // Fog adjustment
    scene.fog = new THREE.Fog(0x050505, 5, 50);

    lightsRef.current = [];

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
    lampCtxRef.current = lampCtx;
    const lampTexture = new THREE.CanvasTexture(lampCanvas);
    lampTexture.minFilter = THREE.NearestFilter;
    lampTexture.magFilter = THREE.NearestFilter;

    // Setup quarantine canvas
    const quarantineCanvas = document.createElement('canvas');
    quarantineCanvas.width = 256;
    quarantineCanvas.height = 256;
    const quarantineCtx = quarantineCanvas.getContext('2d');
    const quarantineTexture = new THREE.CanvasTexture(quarantineCanvas);

    // Create a single large floor plane for baked lighting
    if (currentLevelId !== 3) {
      const floorGeo = new THREE.PlaneGeometry(map[0].length * TILE_SIZE, map.length * TILE_SIZE, 32, 32);
      const bakedFloorMat = new THREE.MeshStandardMaterial({ 
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.2,
        emissive: 0xffffff,
        emissiveIntensity: 1.5,
        emissiveMap: lightMapTexture
      });
      const floorMesh = new THREE.Mesh(floorGeo, bakedFloorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.set((map[0].length * TILE_SIZE) / 2 - TILE_SIZE / 2, -2.01, (map.length * TILE_SIZE) / 2 - TILE_SIZE / 2);
      projectUVs(floorMesh);
      scene.add(floorMesh);
    }

    // Display animation setup
    const setup = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 256, 256);
    };
    if (displayCtx) setup(displayCtx);

    const draw = (ctx: CanvasRenderingContext2D, time: number) => {
      const hasBreach = gameStateRef.current.decals.some(d => d.type === 'HULL_BREACH' && !d.cleaned);
      const color = hasBreach ? '#f00' : '#0f0';
      
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = color;
      ctx.lineWidth = 15;
      
      // Draw some "diagnostics"
      const lineLength = hasBreach ? 40 : 180;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const y = 45 + i * 20;
        const x = 10 + Math.sin(time * 0.005 + i) * 5;
        ctx.moveTo(20, y);
        ctx.lineTo(lineLength + x, y);
      }
      ctx.stroke();
      
      ctx.fillStyle = color;
      ctx.font = '16px monospace';
      if (hasBreach) {
        ctx.fillText(`CRITICAL ERROR: ${Math.floor(time / 1000)}s`, 20, 30);
        ctx.fillText(`O2 LEVEL: ${Math.floor(Math.sin(time * 0.01) * 5 + 15)}%`, 20, 240);
        ctx.fillText(`HULL BREACH DETECTED`, 20, 220);
      } else {
        ctx.fillText(`SYSTEM OK: ${Math.floor(time / 1000)}s`, 20, 30);
        ctx.fillText(`O2 LEVEL: ${Math.floor(Math.sin(time * 0.001) * 10 + 95)}%`, 20, 240);
      }
    };

    const drawQuarantine = (ctx: CanvasRenderingContext2D, time: number, active: boolean, bypassed: boolean) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 256, 256);
      
      if (bypassed) {
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 30px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BYPASS ACTIVE', 128, 100);
        ctx.font = '16px monospace';
        ctx.fillText('SYSTEM OVERRIDE', 128, 140);
        return;
      }

      if (active) {
        const pulse = Math.sin(time * 0.01) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 0, 0, ${0.2 + pulse * 0.3})`;
        ctx.fillRect(0, 0, 256, 256);
        
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 10;
        ctx.strokeRect(10, 10, 236, 236);
        
        ctx.fillStyle = '#f00';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('QUARANTINE', 128, 80);
        
        ctx.font = '18px monospace';
        ctx.fillText('BIOHAZARD DETECTED', 128, 120);
        ctx.fillText('CLEANUP REQUIRED', 128, 150);
        
        ctx.font = '14px monospace';
        ctx.fillText('DOORS LOCKED', 128, 200);
      } else {
        ctx.fillStyle = '#040';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#0f0';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CLEARANCE', 128, 100);
        ctx.font = '18px monospace';
        ctx.fillText('SAFE TO PROCEED', 128, 140);
      }
    };

    const drawRadar = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 256, 256);
      
      const mapW = map[0].length;
      const mapH = map.length;
      const scaleX = 256 / mapW;
      const scaleY = 256 / mapH;
      
      // Draw map outline
      ctx.fillStyle = '#000f00';
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 1;
      map.forEach((row, z) => {
        row.forEach((tile, x) => {
          if (tile !== TileType.EMPTY && tile !== TileType.VENT && tile !== TileType.KEY && tile !== TileType.SERVICE_TUNNEL) {
            ctx.fillRect(x * scaleX, z * scaleY, scaleX, scaleY);
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

      // Draw signal wave if breach exists (as shown in screenshot)
      if (gameStateRef.current.decals.some(d => d.type === 'HULL_BREACH' && !d.cleaned)) {
        const time = Date.now() * 0.001;
        ctx.strokeStyle = '#3366ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(64, 128);
        for (let i = 64; i < 192; i += 3) {
          const x = i;
          const y = 128 + Math.sin(i * 0.05 + time * 5) * 15 + Math.cos(i * 0.1 + time * 3) * 10 + (Math.random() - 0.5) * 8;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const drawLamps = (ctx: CanvasRenderingContext2D, time: number, lod: number = 1) => {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, 256, 256);
      
      if (lod >= 4) return;

      const rows = lod === 1 ? 8 : (lod === 2 ? 4 : 2);
      const cols = lod === 1 ? 8 : (lod === 2 ? 4 : 2);
      const spacing = 256 / rows;
      const radius = lod === 1 ? 8 : (lod === 2 ? 16 : 32);
      
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const seed = r * cols + c;
          const blink = Math.sin(time * 0.005 + seed * 1.5) > 0.5;
          
          ctx.beginPath();
          const x = c * spacing + spacing/2;
          const y = r * spacing + spacing/2;
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          
          if (blink) {
            const colorSeed = (seed + Math.floor(time * 0.001)) % 3;
            let color = '#ff0000';
            if (colorSeed === 1) color = '#00ff00';
            else if (colorSeed === 2) color = '#ffff00';
            
            ctx.fillStyle = color;
            if (lod === 1) {
              ctx.shadowBlur = 15;
              ctx.shadowColor = color;
            }
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = '#111';
            ctx.fill();
          }
        }
      }
    };

    const updateLightMap = (ctx: CanvasRenderingContext2D, map: number[][], lights: Array<{ light: THREE.PointLight; x: number; z: number; tile: TileType; radius?: number; intensity?: number }>) => {
      const rows = map.length;
      const cols = map[0].length;
      const tileSize = 16;
      const width = cols * tileSize;
      const height = rows * tileSize;
      
      if (!isLightmapActiveRef.current) {
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);
        return;
      }
      
      const level = LEVELS[currentLevelId];
      const defaultAmbient = level?.defaultAmbient || '#050505';
      
      // Draw base ambient per tile/sector
      for (let z = 0; z < rows; z++) {
        for (let x = 0; x < cols; x++) {
          let ambientColor = defaultAmbient;
          if (level?.sectors) {
            for (const sector of level.sectors) {
              if (x >= sector.x1 && x <= sector.x2 && z >= sector.z1 && z <= sector.z2) {
                ambientColor = sector.ambientColor;
                break;
              }
            }
          }
          ctx.fillStyle = ambientColor;
          ctx.fillRect(x * tileSize, z * tileSize, tileSize, tileSize);
        }
      }

      const tempCtx = tempLightCtxRef.current;
      const tempCanvas = tempLightCanvasRef.current;
      if (!tempCtx || !tempCanvas) return;

      // Draw light glows
      lights.forEach(({ light, x: kx, z: kz, tile: kTile, radius: rOverride, intensity: iOverride }) => {
        if (light.intensity <= 0) return;
        
        // Clear temp canvas for this light
        tempCtx.clearRect(0, 0, width, height);

        const props = TILE_PROPERTIES[kTile];
        const intensity = (iOverride ?? props?.lightIntensity ?? light.intensity) / 32;
        const color = light.color;
        
        // Map world position to lightmap coordinates for precise placement
        const lx = (light.position.x / TILE_SIZE + 0.5) * tileSize;
        const lz = (light.position.z / TILE_SIZE + 0.5) * tileSize;
        
        const radius = (rOverride ?? props?.lightRadius ?? 7) * tileSize;
        
        // Draw glow on temp canvas
        tempCtx.globalCompositeOperation = 'source-over';
        const grad = tempCtx.createRadialGradient(lx, lz, 0, lx, lz, radius);
        grad.addColorStop(0, `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, ${intensity})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        tempCtx.fillStyle = grad;
        tempCtx.fillRect(lx - radius, lz - radius, radius * 2, radius * 2);

        // Draw shadows for this light on temp canvas
        // Only check tiles within a reasonable range of the light to improve performance
        const checkRadius = Math.ceil(radius / tileSize) + 1;
        const startX = Math.max(0, kx - checkRadius);
        const endX = Math.min(cols - 1, kx + checkRadius);
        const startZ = Math.max(0, kz - checkRadius);
        const endZ = Math.min(rows - 1, kz + checkRadius);

        for (let z = startZ; z <= endZ; z++) {
          for (let x = startX; x <= endX; x++) {
            const tile = map[z][x];
            const props = TILE_PROPERTIES[tile];
            
            if (props?.shadowCasting) {
              // Don't cast shadow for the tile that contains the light source
              if (x === kx && z === kz) continue;

              const tw = tileSize;
              const th = tileSize;
              const cx = x * tw + tw / 2;
              const cz = z * th + th / 2;
              const dx = cx - lx;
              const dz = cz - lz;
              const dist = Math.sqrt(dx * dx + dz * dz);
              
              // Don't cast shadow if light is inside or on the tile
              if (dist < tileSize * 0.4) continue;

              // Perspective Shadow Projection
              // Use shadowRadius from TILE_PROPERTIES
              const shadowRadius = (props.shadowRadius || 0.5) * tw;
              const x0 = cx - shadowRadius;
              const z0 = cz - shadowRadius;
              const x1 = cx + shadowRadius;
              const z1 = cz + shadowRadius;

              const corners = [
                { x: x0, z: z0 },
                { x: x1, z: z0 },
                { x: x1, z: z1 },
                { x: x0, z: z1 }
              ];

              // Find the two corners that form the widest angle from the light source
              const refAngle = Math.atan2(cz - lz, cx - lx);
              let minDiff = Infinity;
              let maxDiff = -Infinity;
              let minCorner = corners[0];
              let maxCorner = corners[0];

              corners.forEach(c => {
                let angle = Math.atan2(c.z - lz, c.x - lx);
                let diff = angle - refAngle;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                if (diff < minDiff) { minDiff = diff; minCorner = c; }
                if (diff > maxDiff) { maxDiff = diff; maxCorner = c; }
              });

              const shadowLength = Math.sqrt(width * width + height * height);
              
              const d1 = Math.sqrt((minCorner.x - lx)**2 + (minCorner.z - lz)**2);
              const p1x = minCorner.x + (minCorner.x - lx) / (d1 || 1) * shadowLength;
              const p1z = minCorner.z + (minCorner.z - lz) / (d1 || 1) * shadowLength;
              
              const d2 = Math.sqrt((maxCorner.x - lx)**2 + (maxCorner.z - lz)**2);
              const p2x = maxCorner.x + (maxCorner.x - lx) / (d2 || 1) * shadowLength;
              const p2z = maxCorner.z + (maxCorner.z - lz) / (d2 || 1) * shadowLength;

              tempCtx.beginPath();
              tempCtx.moveTo(minCorner.x, minCorner.z);
              tempCtx.lineTo(maxCorner.x, maxCorner.z);
              tempCtx.lineTo(p2x, p2z);
              tempCtx.lineTo(p1x, p1z);
              tempCtx.closePath();
              tempCtx.fillStyle = '#000';
              tempCtx.fill();

              // Also fill the caster area itself to ensure no light leaks through the object
              tempCtx.fillRect(x0, z0, x1 - x0, z1 - z0);
            }
          }
        }

        // Blend temp canvas into main lightmap using screen
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(tempCanvas, 0, 0);
      });
      
      // Final pass: No baked light under service tunnels
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000';
      for (let z = 0; z < rows; z++) {
        for (let x = 0; x < cols; x++) {
          const tile = map[z][x];
          if (tile === TileType.SERVICE_TUNNEL) {
            ctx.fillRect(x * tileSize, z * tileSize, tileSize, tileSize);
          }
        }
      }

      // Draw Smudges on floor at the very last step with multiply blending
      ctx.globalCompositeOperation = 'multiply';
      gameStateRef.current.decals.forEach(d => {
        if (d.type === 'SMUDGE' && !d.cleaned && d.pos.y < -1.9) {
          const sx = (d.pos.x + 0.5) * tileSize;
          const sz = (d.pos.z + 0.5) * tileSize;
          const size = (d.size || 1) * tileSize;
          const color = d.metadata?.color || 0x00ff00;
          const hex = `#${color.toString(16).padStart(6, '0')}`;
          
          // For multiply, we want the "background" to be white where there's no smudge
          // But since we are using globalCompositeOperation = 'multiply', 
          // we are multiplying the existing lightmap by what we draw.
          // So we should draw the smudge color on a white background? 
          // No, we just draw the smudge. Where we don't draw anything, nothing changes.
          // Actually, we should use a gradient that goes from the smudge color to white.
          
          const grad = ctx.createRadialGradient(sx, sz, size*0.9, sx, sz, size);
          grad.addColorStop(0, hex);
          grad.addColorStop(1, '#ffffff');
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(sx, sz, size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';
    };

    const level = LEVELS[currentLevelId];
    lightOverrides.current = level.lightOverrides || {};

    map.forEach((row, z) => {
      row.forEach((tile, x) => {
        const xPos = x * TILE_SIZE;
        const zPos = z * TILE_SIZE;
        const key = `${x},${z}`;

        const floorGeo = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);
        
        // Floor
        if (currentLevelId === 3) {
          const vFloor = createVaporwaveFloorGeometry();
          vFloor.position.set(xPos, 0, zPos);
          scene.add(vFloor);
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
            const propsV = TILE_PROPERTIES[tile];
            const overrideV = lightOverrides.current[`${x},${z}`];
            const intensityV = overrideV?.intensity ?? propsV?.lightIntensity ?? 1;
            const radiusV = overrideV?.radius ?? propsV?.lightRadius ?? 1.0;
            const ventLight = new THREE.PointLight(0x00ff88, intensityV, radiusV);
            ventLight.position.set(xPos, -1.8, zPos);
            scene.add(ventLight);
            lightsRef.current.push({ light: ventLight, x, z, tile, radius: overrideV?.radius, intensity: overrideV?.intensity });
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
          case TileType.LAMP_WALL:
          case TileType.QUARANTINE_DISPLAY:
            // Add wall base
            const wallBase = tile === TileType.LAMP_WALL ? createLampWallGeometry() : new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE, 4, TILE_SIZE), wallMat);
            wallBase.position.set(xPos, 0, zPos);
            projectUVs(wallBase);
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
                  if (tile === TileType.DISPLAY_WALL || tile === TileType.RADAR_WALL || tile === TileType.LAMP_WALL || tile === TileType.QUARANTINE_DISPLAY) {
                    const screenGeo = new THREE.PlaneGeometry(2, 2);
                    const screenMat = new THREE.MeshBasicMaterial({ 
                      map: tile === TileType.DISPLAY_WALL ? displayTexture : 
                           (tile === TileType.RADAR_WALL ? radarTexture : 
                           (tile === TileType.QUARANTINE_DISPLAY ? quarantineTexture : lampTexture))
                    });
                    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
                    screenMesh.position.set(xPos + n.pos[0], 0.5, zPos + n.pos[2]);
                    screenMesh.rotation.y = n.rot;
                    scene.add(screenMesh);

                    if (!lightAdded) {
                      const props = TILE_PROPERTIES[tile];
                      const override = lightOverrides.current[`${x},${z}`];
                      const color = tile === TileType.DISPLAY_WALL ? 0x00ff00 : 
                                   (tile === TileType.RADAR_WALL ? 0x00ffff : 
                                   (tile === TileType.QUARANTINE_DISPLAY ? 0xff0000 : 0xffff00));
                      const intensity = override?.intensity ?? props?.lightIntensity ?? 5;
                      const radius = override?.radius ?? props?.lightRadius ?? 10;
                      const pLight = new THREE.PointLight(color, intensity, radius);
                      pLight.position.set(xPos + n.pos[0] * 0.9, 0.5, zPos + n.pos[2] * 0.9);
                      scene.add(pLight);
                      lightsRef.current.push({ light: pLight, x, z, tile, radius: override?.radius, intensity: override?.intensity });
                      lightAdded = true;
                    }
                  } else {
                    const isBottom = tile === TileType.LIGHT_BOTTOM;
                    const fixture = createLightFixtureGeometry(isBottom ? 'bottom' : 'middle');
                    fixture.position.set(xPos + n.pos[0] * 0.98, isBottom ? -1.5 : 0, zPos + n.pos[2] * 0.98);
                    fixture.rotation.y = n.rot;
                    scene.add(fixture);
                    
                    if (!lightAdded) {
                      const props = TILE_PROPERTIES[tile];
                      const override = lightOverrides.current[`${x},${z}`];
                      const intensity = override?.intensity ?? props?.lightIntensity ?? (isBottom ? 5 : 8);
                      const radius = override?.radius ?? props?.lightRadius ?? 10;
                      const pLight = new THREE.PointLight(0xffffff, intensity, radius);
                      pLight.position.set(xPos + n.pos[0] * 0.9, isBottom ? -1.5 : 0, zPos + n.pos[2] * 0.9);
                      scene.add(pLight);
                      lightsRef.current.push({ light: pLight, x, z, tile, radius: override?.radius, intensity: override?.intensity });
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
              const propsJ = TILE_PROPERTIES[tile];
              const overrideJ = lightOverrides.current[`${x},${z}`];
              const intensityJ = overrideJ?.intensity ?? propsJ?.lightIntensity ?? 5;
              const radiusJ = overrideJ?.radius ?? propsJ?.lightRadius ?? 5;
              const redLight = new THREE.PointLight(0xff0000, intensityJ, radiusJ);
              redLight.position.set(xPos, -1.8, zPos);
              scene.add(redLight);
              lightsRef.current.push({ light: redLight, x, z, tile, radius: overrideJ?.radius, intensity: overrideJ?.intensity });
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
          case TileType.NEON_TUBE_CYAN:
          case TileType.NEON_TUBE_PURPLE:
          case TileType.NEON_TUBE_PINK:
          case TileType.NEON_TUBE_WHITE:
            let neonColor = 0x00ffff;
            if (tile === TileType.NEON_TUBE_PURPLE) neonColor = 0x8800ff;
            if (tile === TileType.NEON_TUBE_PINK) neonColor = 0xff00ff;
            if (tile === TileType.NEON_TUBE_WHITE) neonColor = 0xffffff;
            
            const neonTube = createNeonTubeGeometry(neonColor);
            neonTube.position.set(xPos, 1.9, zPos);
            scene.add(neonTube);
            
            // Add glow planes (fixed to tube)
            const glowWidth = 4;
            const glowHeight = 8;
            
            // Top glow (horizontal, along the tube)
            const glowTop = createGlowPlane(neonColor, glowWidth, 16);
            glowTop.position.set(xPos, 1.98, zPos);
            glowTop.rotation.x = Math.PI / 2;
            //glowTop.rotation.z = Math.PI / 2; // Align with tube
            glowTop.name = 'neon_glow_fixed';
            scene.add(glowTop);
            
            // Vertical glow (hanging down, XY plane cross-shape)
            const glowVertical1 = createGlowPlane(neonColor, glowWidth, 12);
            glowVertical1.position.set(xPos, 1.0, zPos); // Centered lower to hang down
            glowVertical1.name = 'neon_glow_fixed';
            scene.add(glowVertical1);

            const glowVertical2 = createGlowPlane(neonColor, glowWidth, 12);
            glowVertical2.position.set(xPos, 1.0, zPos);
            glowVertical2.rotation.y = Math.PI / 2;
            glowVertical2.name = 'neon_glow_fixed';
            scene.add(glowVertical2);

            const propsN = TILE_PROPERTIES[tile];
            const pLightN = new THREE.PointLight(neonColor, propsN?.lightIntensity ?? 25, propsN?.lightRadius ?? 2);
            pLightN.position.set(xPos, 1.8, zPos);
            scene.add(pLightN);
            lightsRef.current.push({ light: pLightN, x, z, tile });
            break;
          case TileType.NEON_CORNER_WALL:
            const cornerWall = createNeonCornerWallGeometry();
            cornerWall.position.set(xPos, 0, zPos);
            
            // Check neighbors to rotate corner to empty space
            const cNeighbors = [
              { dx: 1, dz: 1, rot: 0 },
              { dx: -1, dz: 1, rot: Math.PI / 2 },
              { dx: -1, dz: -1, rot: Math.PI },
              { dx: 1, dz: -1, rot: -Math.PI / 2 }
            ];
            for (const n of cNeighbors) {
              const nx = x + n.dx;
              const nz = z + n.dz;
              if (nz >= 0 && nz < map.length && nx >= 0 && nx < map[0].length) {
                if (map[nz][nx] === TileType.EMPTY) {
                  cornerWall.rotation.y = n.rot;
                  break;
                }
              }
            }
            projectUVs(cornerWall);
            scene.add(cornerWall);
            
            // Add vertical glow (fixed cross-shape for better look)
            const vGlow1 = createGlowPlane(0x00ffff, 4, 8);
            // Calculate rotated position for glow
            const glowOffset = 2.0;
            const angle = cornerWall.rotation.y;
            const gx = xPos + Math.cos(angle) * glowOffset - Math.sin(angle) * glowOffset;
            const gz = zPos + Math.sin(angle) * glowOffset + Math.cos(angle) * glowOffset;
            
            vGlow1.position.set(gx, 0, gz);
            vGlow1.rotation.y = angle + Math.PI / 4;
            vGlow1.name = 'neon_glow_fixed';
            scene.add(vGlow1);

            const vGlow2 = createGlowPlane(0x00ffff, 4, 8);
            vGlow2.position.set(gx, 0, gz);
            vGlow2.rotation.y = angle - Math.PI / 4;
            vGlow2.name = 'neon_glow_fixed';
            scene.add(vGlow2);

            const propsC1 = TILE_PROPERTIES[tile];
            const pLightC = new THREE.PointLight(0x00ffff, propsC1?.lightIntensity ?? 2, propsC1?.lightRadius ?? 1);
            pLightC.position.set(xPos + 1.8, 0, zPos + 1.8);
            scene.add(pLightC);
            lightsRef.current.push({ light: pLightC, x, z, tile });
            break;
          case TileType.SERVICE_TUNNEL:
            mesh = createServiceTunnelGeometry();
            const propsT = TILE_PROPERTIES[tile];
            const overrideT = lightOverrides.current[`${x},${z}`];
            const intensityT = overrideT?.intensity ?? propsT?.lightIntensity ?? 5;
            const radiusT = overrideT?.radius ?? propsT?.lightRadius ?? 5;
            const tunnelLight = new THREE.PointLight(0xffff00, intensityT, radiusT);
            tunnelLight.position.set(xPos, -2, zPos);
            scene.add(tunnelLight);
            lightsRef.current.push({ light: tunnelLight, x, z, tile, radius: overrideT?.radius, intensity: overrideT?.intensity });
            // Rotate to align with neighbors
            if ((x > 0 && map[z][x-1] === TileType.SERVICE_TUNNEL) || (x < map[0].length - 1 && map[z][x+1] === TileType.SERVICE_TUNNEL)) {
              mesh.rotation.y = Math.PI / 2;
            }
            break;
          case TileType.CEILING_LAMP:
            mesh = createCeilingLampGeometry();
            const propsC2 = TILE_PROPERTIES[tile];
            const overrideC2 = lightOverrides.current[`${x},${z}`];
            const intensityC2 = overrideC2?.intensity ?? propsC2?.lightIntensity ?? 10;
            const radiusC2 = overrideC2?.radius ?? propsC2?.lightRadius ?? 20;
            const lightC = new THREE.PointLight(0xffffff, intensityC2, radiusC2);
            lightC.position.set(xPos, 1.8, zPos);
            scene.add(lightC);
            lightsRef.current.push({ light: lightC, x, z, tile, radius: overrideC2?.radius, intensity: overrideC2?.intensity });
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
          projectUVs(mesh);
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

    // Render Decals
    const levelDecals = level.decals || [];
    levelDecals.forEach((d, i) => {
      let decalMesh: THREE.Object3D | null = null;
      switch (d.type) {
        case 'POSTER':
          decalMesh = createPosterGeometry(d.metadata?.posterType || 'motivational');
          break;
        case 'HULL_BREACH':
          decalMesh = createHullBreachGeometry();
          break;
        case 'BULLET_IMPACT':
          decalMesh = createBulletImpactGeometry();
          break;
        case 'CLAW_MARK':
          decalMesh = createClawMarkGeometry();
          break;
        case 'CRACK':
          decalMesh = createCrackGeometry();
          break;
        case 'BULLET_SHELL':
          decalMesh = createBulletShellGeometry();
          break;
        case 'SMUDGE':
          decalMesh = createSmudgeGeometry(d.metadata?.color || 0x00ff00);
          break;
      }

      if (decalMesh) {
        decalMesh.position.set(d.pos.x * TILE_SIZE, d.pos.y, d.pos.z * TILE_SIZE);
        decalMesh.rotation.set(d.rot.x, d.rot.y, d.rot.z);
        decalMesh.scale.setScalar(d.scale);
        decalMesh.name = `decal_${i}`;
        scene.add(decalMesh);
      }
    });

    setGameState(prev => ({
      ...prev,
      decals: levelDecals.map((d, i) => ({
        ...d,
        id: `decal_${i}`,
        cleaned: false,
        size: (d.type === 'SMUDGE' || d.type === 'HULL_BREACH') ? 1 : undefined,
        health: d.type === 'POSTER' ? 100 : undefined
      })),
      totalMess: levelDecals.length,
      cleanupProgress: 0,
      isQuarantineActive: levelDecals.some(d => d.type === 'HULL_BREACH' || d.type === 'SMUDGE'),
      isQuarantineBypassed: false
    }));

    const animate = () => {
      requestAnimationFrame(animate);
      frameCounterRef.current++;
      const time = Date.now() * 0.001;

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
      lightsRef.current.forEach(({ light: l, x: kx, z: kz, tile }) => {
        const tileKey = `${kx},${kz}`;
        const dx = kx - logicalPos.current.x;
        const dz = kz - logicalPos.current.z;
        const dist = Math.sqrt(dx*dx + dz*dz);

        // Check if behind player
        let behind = false;
        if (dx !== 0 || dz !== 0) {
          if (logicalDir.current === Direction.NORTH && dz > 0) behind = true;
          else if (logicalDir.current === Direction.SOUTH && dz < 0) behind = true;
          else if (logicalDir.current === Direction.EAST && dx < 0) behind = true;
          else if (logicalDir.current === Direction.WEST && dx > 0) behind = true;
        }

        // Apply LOD and behind check to rendering visibility
        if (dist >= 10 || behind) {
          l.visible = false;
        } else {
          l.visible = true;
        }

        let baseIntensity = tile === TileType.CEILING_LAMP ? 15 : (tile === TileType.LIGHT_MIDDLE ? 12 : (tile === TileType.DISPLAY_WALL || tile === TileType.RADAR_WALL ? 8 : 8));
        
        if (overclockedTilesRef.current.has(tileKey)) {
          l.intensity = baseIntensity * 10 + Math.sin(Date.now() * 0.05) * 20;
          l.color.setHex(0xffffff);
        } else {
          if (tile === TileType.LIGHT_BOTTOM) l.intensity = 8;
          else if (tile === TileType.LIGHT_MIDDLE) l.intensity = 12;
          else if (tile === TileType.CEILING_LAMP) l.intensity = 15;
          else if (tile === TileType.DISPLAY_WALL) {
            l.intensity = 8;
            l.color.setHex(0x00ff00);
          } else if (tile === TileType.RADAR_WALL) {
            l.intensity = 8;
            l.color.setHex(0x00ffff);
          } else if (tile === TileType.LAMP_WALL) {
            l.intensity = 10 + Math.sin(Date.now() * 0.005) * 3;
            l.color.setHex(0xffff00);
          }
        }
      });

      // Update smudges and hull breaches in 3D scene
      gameStateRef.current.decals.forEach((d, i) => {
        if ((d.type === 'SMUDGE' || d.type === 'HULL_BREACH') && !d.cleaned) {
          const mesh = scene.getObjectByName(`decal_${i}`);
          if (mesh) {
            mesh.scale.setScalar(d.scale * (d.size || 1));
          }
        }
      });

      // Update neon glow planes to face camera
      if (sceneRef.current && cameraRef.current) {
        sceneRef.current.traverse((child) => {
          if (child.name === 'neon_glow_v') {
            child.lookAt(cameraRef.current!.position);
            
            // Pulse effect
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
              const pulse = 0.8 + Math.sin(time * 0.005) * 0.2;
              child.material.opacity = pulse;
            }
          } else if (child.name === 'neon_glow_fixed') {
            // Pulse effect only for fixed glow
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
              const pulse = 0.8 + Math.sin(time * 0.005) * 0.2;
              child.material.opacity = pulse;
            }
          }
        });
      }

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

      // Check area around player for LOD and proximity
      const dpx = logicalPos.current.x;
      const dpz = logicalPos.current.z;
      let minLampDist = 999;
      let minDisplayDist = 999;
      let minRadarDist = 999;
      let minQuarantineDist = 999;
      let nearDisplay = false;
      let nearRadar = false;
      let nearLamps = false;
      let nearQuarantine = false;

      for (let dz = -7; dz <= 7; dz++) {
        for (let dx = -7; dx <= 7; dx++) {
          const tx = dpx + dx;
          const tz = dpz + dz;
          if (tz >= 0 && tz < map.length && tx >= 0 && tx < map[0].length) {
            const tile = map[tz][tx];
            const dist = Math.sqrt(dx*dx + dz*dz);
            
            // Check if behind player
            let behind = false;
            if (dx !== 0 || dz !== 0) {
              if (logicalDir.current === Direction.NORTH && dz > 0) behind = true;
              else if (logicalDir.current === Direction.SOUTH && dz < 0) behind = true;
              else if (logicalDir.current === Direction.EAST && dx < 0) behind = true;
              else if (logicalDir.current === Direction.WEST && dx > 0) behind = true;
            }

            if (!behind) {
              if (tile === TileType.DISPLAY_WALL && dist <= 7) {
                nearDisplay = true;
                if (dist < minDisplayDist) minDisplayDist = dist;
              }
              if (tile === TileType.RADAR_WALL && dist <= 7) {
                nearRadar = true;
                if (dist < minRadarDist) minRadarDist = dist;
              }
              if (tile === TileType.LAMP_WALL && dist <= 7) {
                nearLamps = true;
                if (dist < minLampDist) minLampDist = dist;
              }
              if (tile === TileType.QUARANTINE_DISPLAY && dist <= 7) {
                nearQuarantine = true;
                if (dist < minQuarantineDist) minQuarantineDist = dist;
              }
            }
          }
        }
      }

      let lampLOD = 4;
      if (minLampDist < 3) lampLOD = 1;
      else if (minLampDist < 5) lampLOD = 2;
      else if (minLampDist < 7) lampLOD = 3;

      const shouldUpdateHighFreq = (dist: number) => dist <= 3 || frameCounterRef.current % 4 === 0;

      if (displayCtxRef.current && nearDisplay && shouldUpdateHighFreq(minDisplayDist)) {
        draw(displayCtxRef.current, Date.now());
        displayTexture.needsUpdate = true;
      }

      if (quarantineCtx && nearQuarantine && shouldUpdateHighFreq(minQuarantineDist)) {
        drawQuarantine(quarantineCtx, Date.now(), gameStateRef.current.isQuarantineActive, gameStateRef.current.isQuarantineBypassed);
        quarantineTexture.needsUpdate = true;
      }

      if (lampCtxRef.current && lampLOD < 4 && shouldUpdateHighFreq(minLampDist)) {
        drawLamps(lampCtxRef.current, Date.now(), lampLOD);
        lampTexture.needsUpdate = true;
      }

      if (lightMapCtxRef.current) {
        updateLightMap(lightMapCtxRef.current, map, lightsRef.current);
        lightMapTexture.needsUpdate = true;
      }

      // Update radar animation
      if (radarCtxRef.current && nearRadar && shouldUpdateHighFreq(minRadarDist)) {
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

      // Debug View Rendering
      if (isDebugViewOpenRef.current && debugCtxRef.current && lightMapCanvasRef.current) {
        const ctx = debugCtxRef.current;
        const lCanvas = lightMapCanvasRef.current;
        const canvas = debugCanvasRef.current!;
        
        if (canvas.width !== lCanvas.width || canvas.height !== lCanvas.height) {
          canvas.width = lCanvas.width;
          canvas.height = lCanvas.height;
        }
        
        // Draw the actual lightmap
        ctx.drawImage(lCanvas, 0, 0);
        
        // Draw map outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        const tileSize = 16;

        // Draw actual tile outlines and animated texture status
        for (let z = 0; z < map.length; z++) {
          for (let x = 0; x < map[0].length; x++) {
            const tile = map[z][x];
            if (tile !== TileType.EMPTY) {
              ctx.strokeStyle = 'rgba(0, 255, 0, 0.15)';
              ctx.lineWidth = 1;
              ctx.strokeRect(x * tileSize, z * tileSize, tileSize, tileSize);
              
              if (tile === TileType.WALL || tile === TileType.PILLAR) {
                ctx.fillStyle = 'rgba(0, 255, 0, 0.05)';
                ctx.fillRect(x * tileSize, z * tileSize, tileSize, tileSize);
              }
              
              // Animated texture status (red vs green block)
              if (tile === TileType.DISPLAY_WALL || tile === TileType.RADAR_WALL || tile === TileType.LAMP_WALL) {
                const dx = x - logicalPos.current.x;
                const dz = z - logicalPos.current.z;
                const dist = Math.sqrt(dx*dx + dz*dz);
                
                // Check if behind player
                const dirVec = new THREE.Vector3(0, 0, -1);
                if (playerRef.current) {
                  dirVec.applyQuaternion(playerRef.current.quaternion);
                }
                const toTile = new THREE.Vector3(x - logicalPos.current.x, 0, z - logicalPos.current.z).normalize();
                const dot = dirVec.dot(toTile);
                
                const isActive = dist <= 7 && dot > -0.5;
                
                ctx.fillStyle = isActive ? '#0f0' : '#f00';
                ctx.fillRect(x * tileSize + 4, z * tileSize + 4, tileSize - 8, tileSize - 8);
              }
            }
          }
        }

        // Draw active light sources
        lightsRef.current.forEach(l => {
          const dx = l.x - logicalPos.current.x;
          const dz = l.z - logicalPos.current.z;
          const dist = Math.sqrt(dx*dx + dz*dz);
          
          // Check if behind player
          const dirVec = new THREE.Vector3(0, 0, -1);
          if (playerRef.current) {
            dirVec.applyQuaternion(playerRef.current.quaternion);
          }
          const toLight = new THREE.Vector3(l.x - logicalPos.current.x, 0, l.z - logicalPos.current.z).normalize();
          const dot = dirVec.dot(toLight);
          
          const isActive = dist <= 10 && dot > -0.5;
          
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(
            (l.x + 0.5) * tileSize, 
            (l.z + 0.5) * tileSize, 
            2, 0, Math.PI * 2
          );
          if (isActive) {
            ctx.fillStyle = '#fff';
            ctx.fill();
          } else {
            ctx.stroke();
          }
        });
        
        // Draw player
        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.arc(
          (logicalPos.current.x + 0.5) * tileSize, 
          (logicalPos.current.z + 0.5) * tileSize, 
          6, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Draw enemies
        ctx.fillStyle = '#f00';
        enemiesRef.current.forEach(enemy => {
          ctx.beginPath();
          ctx.arc(
            (enemy.pos.x + 0.5) * tileSize, 
            (enemy.pos.z + 0.5) * tileSize, 
            5, 0, Math.PI * 2
          );
          ctx.fill();
        });
        
        // Draw lights (full circle vs empty circle)
        lightsRef.current.forEach(({ light, x, z }) => {
          ctx.beginPath();
          ctx.arc(
            (x + 0.5) * tileSize, 
            (z + 0.5) * tileSize, 
            2, 0, Math.PI * 2
          );
          if (light.visible) {
            ctx.fillStyle = '#ff0';
            ctx.fill();
          } else {
            ctx.strokeStyle = '#ff0';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      }
    };

    let animationId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      const width = window.innerWidth / renderScaleRef.current;
      const height = window.innerHeight / renderScaleRef.current;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height, false);
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

      {/* Debug View */}
      {isDebugViewOpen && (
        <div className="fixed bottom-4 right-4 w-64 h-64 bg-black/90 border border-yellow-500/50 z-50 overflow-hidden pointer-events-none flex flex-col">
          <div className="p-2 border-b border-yellow-500/20 flex justify-between items-center">
            <span className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest">Debug View</span>
            <span className="text-[8px] font-mono text-yellow-500/50 uppercase">F10 to toggle</span>
          </div>
          <div className="flex-1 relative">
            <canvas 
              ref={(canvas) => {
                debugCanvasRef.current = canvas;
                if (canvas) {
                  debugCtxRef.current = canvas.getContext('2d');
                }
              }}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="p-1 bg-yellow-500/10 text-[8px] font-mono text-yellow-500/70 flex justify-around">
            <span>P: {logicalPos.current.x},{logicalPos.current.z}</span>
            <span>E: {enemies.length}</span>
            <span>L: {lightsRef.current.length}</span>
            <span className={isLightmapActive ? "text-emerald-500" : "text-red-500"}>
              LM: {isLightmapActive ? "ON" : "OFF"}
            </span>
          </div>
        </div>
      )}

      {/* Level Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-emerald-500 font-mono"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <div className="text-xs opacity-50 mb-2 tracking-[0.3em]">INITIATING SECTOR TRANSFER</div>
              <div className="text-4xl md:text-6xl font-bold tracking-tighter mb-8">{transitionLevelName}</div>
              
              <div className="w-64 h-1 bg-emerald-900/30 mx-auto relative overflow-hidden">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-emerald-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </div>
              
              <motion.div 
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mt-4 text-[10px] tracking-widest"
              >
                SYNCHRONIZING SYSTEMS...
              </motion.div>
            </motion.div>
            
            {/* Decorative scanlines */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Debug Buttons */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-50 pointer-events-none">
        <div className="flex gap-2 justify-end">
          {[1, 2, 4, 8].map(scale => (
            <button
              key={scale}
              onPointerDown={(e) => { e.preventDefault(); setRenderScale(scale); }}
              className={`pointer-events-auto w-8 h-8 flex items-center justify-center rounded border text-[10px] font-bold transition-colors ${renderScale === scale ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-black/60 text-emerald-500/70 border-emerald-500/30 active:bg-emerald-500/20'}`}
            >
              {scale}x
            </button>
          ))}
        </div>
        
        {isMobile && (
          <div className="flex justify-end gap-2">
            <button 
              onPointerDown={(e) => { e.preventDefault(); setIsDebugViewOpen(prev => !prev); }}
              className="pointer-events-auto bg-black/60 border border-emerald-500/30 px-3 py-1 rounded text-[10px] text-emerald-500/70 active:bg-emerald-500/20 touch-none select-none"
            >
              DEBUG
            </button>
            <button 
              onPointerDown={(e) => { e.preventDefault(); setIsLightmapActive(prev => !prev); }}
              className="pointer-events-auto bg-black/60 border border-emerald-500/30 px-3 py-1 rounded text-[10px] text-emerald-500/70 active:bg-emerald-500/20 touch-none select-none"
            >
              LIGHTMAP
            </button>
          </div>
        )}
      </div>

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
          <div className="mt-2 text-[10px] text-emerald-500/50 font-mono tracking-widest uppercase border-t border-emerald-500/10 pt-2">
            LOCATION: {levelName}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {gameState.isQuarantineActive && !gameState.isQuarantineBypassed && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-red-500/20 text-red-500 px-3 py-1 rounded-full border border-red-500/50 text-xs font-bold animate-pulse"
            >
              <AlertTriangle className="w-4 h-4" /> QUARANTINE ACTIVE
            </motion.div>
          )}
          <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-emerald-500/20 text-right">
            <div className="text-[10px] opacity-50 mb-1 tracking-widest">CLEANUP PROGRESS</div>
            <div className="text-xl font-bold">{gameState.cleanupProgress} / {gameState.totalMess}</div>
            <div className="w-32 h-1 bg-emerald-950 mt-2 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-emerald-500"
                animate={{ width: `${(gameState.totalMess > 0 ? (gameState.cleanupProgress / gameState.totalMess) * 100 : 100)}%` }}
              />
            </div>
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

      {/* Mobile Debug Buttons */}
      {isMobile && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
          <button 
            onClick={() => setIsDebugViewOpen(prev => !prev)}
            className="p-2 bg-black/50 border border-white/20 rounded-full text-white pointer-events-auto"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsLightmapActive(prev => !prev)}
            className="p-2 bg-black/50 border border-white/20 rounded-full text-white pointer-events-auto"
          >
            <Lightbulb className="w-5 h-5" />
          </button>
        </div>
      )}

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

      {/* Radar UI */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="relative w-[400px] h-[400px] flex items-center justify-center">
          {/* Outer Ring */}
          <div className="absolute inset-0 border border-emerald-500/10 rounded-full" />
          <div className="absolute inset-4 border border-emerald-500/5 rounded-full" />
          
          {/* Scanning Pulse */}
          <motion.div 
            className="absolute inset-0 border-2 border-emerald-500/20 rounded-full"
            animate={{ scale: [1, 1.1], opacity: [0.3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
          />

          {/* Compass Ticks */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
            <div 
              key={deg}
              className={`absolute w-[1px] ${deg % 90 === 0 ? 'h-4 bg-emerald-500/40' : 'h-2 bg-emerald-500/20'}`}
              style={{ 
                top: 0,
                left: '50%',
                transform: `translateX(-50%) rotate(${deg}deg)`,
                transformOrigin: '50% 200px'
              }}
            />
          ))}
        </div>
      </div>

      {/* Enemy Arrows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {enemies.map(enemy => {
          const dx = enemy.pos.x - currentPos.current.x / TILE_SIZE;
          const dz = enemy.pos.z - currentPos.current.z / TILE_SIZE;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > 8) return null; // Increased range for radar

          const angleToEnemy = Math.atan2(dx, dz);
          const playerAngle = currentRot.current;
          const relativeAngle = playerAngle - angleToEnemy;
          
          // If enemy is roughly in front and close, don't show arrow to avoid clutter
          if (dist < 2 && (Math.abs(relativeAngle) < Math.PI / 6 || Math.abs(relativeAngle) > 11 * Math.PI / 6)) return null;

          return (
            <motion.div 
              key={enemy.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute w-4 h-4 text-red-500/60"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotate(${relativeAngle}rad) translateY(-200px)`
              }}
            >
              <ArrowUp className="w-full h-full" />
              {/* Distance indicator */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[8px] font-bold text-red-500/40 whitespace-nowrap">
                {Math.round(dist * 4)}m
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Center Reticle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 z-20">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 border border-emerald-500/30 rounded-full" />
          <div className="absolute w-4 h-[1px] bg-emerald-500/50 left-0" />
          <div className="absolute w-4 h-[1px] bg-emerald-500/50 right-0" />
          <div className="absolute h-4 w-[1px] bg-emerald-500/50 top-0" />
          <div className="absolute h-4 w-[1px] bg-emerald-500/50 bottom-0" />
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
              onPointerDown={(e) => { e.preventDefault(); handleUse(); }}
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
          <span>WASD: MOVE</span>
          <span>SPACE: INTERACT</span>
          <span>F/R: ATTACK</span>
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
