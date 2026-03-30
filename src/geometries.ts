import * as THREE from 'three';
import { TileType } from './types';

export function createPillarGeometry() {
  const group = new THREE.Group();
  const base = new THREE.BoxGeometry(1, 4, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 });
  const mesh = new THREE.Mesh(base, material);
  group.add(mesh);
  
  // Add some details
  const detailGeo = new THREE.CylinderGeometry(0.6, 0.6, 4.1, 8);
  const detailMesh = new THREE.Mesh(detailGeo, material);
  group.add(detailMesh);
  
  return group;
}

export function createAngledWallGeometry() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.2, roughness: 0.8 });
  
  // 3 angled pieces
  for (let i = 0; i < 3; i++) {
    const geo = new THREE.BoxGeometry(4, 4, 0.5);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.z = -0.5 + i * 0.2;
    mesh.rotation.y = (i - 1) * 0.2;
    group.add(mesh);
  }
  
  return group;
}

export function createWindowWallGeometry() {
  const group = new THREE.Group();
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const glassMaterial = new THREE.MeshPhysicalMaterial({ 
    color: 0x88ccff, 
    transparent: true, 
    opacity: 0.3,
    transmission: 0.5,
    thickness: 0.1
  });
  
  const frame = new THREE.BoxGeometry(4, 4, 0.4);
  const frameMesh = new THREE.Mesh(frame, frameMaterial);
  group.add(frameMesh);
  
  const window = new THREE.BoxGeometry(2, 2, 0.5);
  const windowMesh = new THREE.Mesh(window, glassMaterial);
  windowMesh.position.y = 0.5;
  group.add(windowMesh);
  
  return group;
}

export function createVentGeometry() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const base = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(base, material);
  mesh.rotation.x = -Math.PI / 2;
  group.add(mesh);
  
  // Grate lines
  for (let i = 0; i < 5; i++) {
    const line = new THREE.BoxGeometry(1.8, 0.05, 0.1);
    const lineMesh = new THREE.Mesh(line, material);
    lineMesh.position.y = 0.05;
    lineMesh.position.z = -0.8 + i * 0.4;
    group.add(lineMesh);
  }
  
  return group;
}

export function createObstacleGeometry() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x664422, roughness: 0.8 });
  const box = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  const mesh = new THREE.Mesh(box, material);
  mesh.position.y = -1.25;
  group.add(mesh);
  return group;
}

export function createKeyGeometry() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xaa0000 });
  const card = new THREE.BoxGeometry(0.3, 0.05, 0.5);
  const mesh = new THREE.Mesh(card, material);
  mesh.position.y = -1.5;
  group.add(mesh);
  return group;
}

export function createBarricadeGeometry() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.5 });
  const base = new THREE.BoxGeometry(3.5, 1, 0.5);
  const mesh = new THREE.Mesh(base, material);
  mesh.position.y = -1.5;
  group.add(mesh);
  return group;
}

export function createBoxGeometry() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.9 });
  const box = new THREE.BoxGeometry(2, 2, 2);
  const mesh = new THREE.Mesh(box, material);
  mesh.position.y = -1;
  group.add(mesh);
  
  // Add some straps
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const strap1 = new THREE.BoxGeometry(2.1, 0.1, 0.2);
  const strap1Mesh = new THREE.Mesh(strap1, strapMat);
  strap1Mesh.position.y = -1;
  group.add(strap1Mesh);
  
  return group;
}

export function createLightFixtureGeometry(position: 'bottom' | 'middle') {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2 });
  
  const fixture = new THREE.BoxGeometry(0.5, 0.5, 0.1);
  const fixtureMesh = new THREE.Mesh(fixture, material);
  fixtureMesh.name = 'fixture_base';
  group.add(fixtureMesh);
  
  const light = new THREE.BoxGeometry(0.3, 0.3, 0.05);
  const lightMesh = new THREE.Mesh(light, lightMat);
  lightMesh.name = 'fixture_light';
  lightMesh.position.z = 0.05;
  group.add(lightMesh);
  
  return group;
}

export function createCeilingLampGeometry() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 });
  
  const fixture = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 8);
  const fixtureMesh = new THREE.Mesh(fixture, material);
  fixtureMesh.name = 'fixture_base';
  group.add(fixtureMesh);
  
  const light = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 8);
  const lightMesh = new THREE.Mesh(light, lightMat);
  lightMesh.name = 'fixture_light';
  lightMesh.position.y = -0.1;
  group.add(lightMesh);
  
  return group;
}

export function createSegmentedWallGeometry() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.3, roughness: 0.7 });
  
  // Bottom angled segment (30 degrees)
  const bottomGeo = new THREE.BoxGeometry(4, 1.2, 0.5);
  const bottomMesh = new THREE.Mesh(bottomGeo, material);
  bottomMesh.position.y = -1.4;
  bottomMesh.position.z = 0.3;
  bottomMesh.rotation.x = Math.PI / 6; // 30 degrees
  group.add(bottomMesh);
  
  // Middle vertical segment
  const middleGeo = new THREE.BoxGeometry(4, 1.6, 0.5);
  const middleMesh = new THREE.Mesh(middleGeo, material);
  middleMesh.position.y = 0;
  group.add(middleMesh);
  
  // Top angled segment (-30 degrees)
  const topGeo = new THREE.BoxGeometry(4, 1.2, 0.5);
  const topMesh = new THREE.Mesh(topGeo, material);
  topMesh.position.y = 1.4;
  topMesh.position.z = 0.3;
  topMesh.rotation.x = -Math.PI / 6; // -30 degrees
  group.add(topMesh);
  
  return group;
}

export function createServicePathGeometry(type: 'straight' | 'junction') {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.5 });
  
  if (type === 'straight') {
    // Two large blocks on the sides
    const leftBlock = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4, 4), material);
    leftBlock.position.x = -1.25;
    group.add(leftBlock);
    
    const rightBlock = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4, 4), material);
    rightBlock.position.x = 1.25;
    group.add(rightBlock);
  } else {
    // Four blocks in the corners
    const positions = [
      { x: -1.25, z: -1.25 },
      { x: 1.25, z: -1.25 },
      { x: -1.25, z: 1.25 },
      { x: 1.25, z: 1.25 }
    ];
    positions.forEach(pos => {
      const block = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4, 1.5), material);
      block.position.set(pos.x, 0, pos.z);
      group.add(block);
    });
  }
  
  return group;
}

export function createBulkheadDoorGeometry() {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x222244 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x4444ff, metalness: 0.8, roughness: 0.2 });
  
  const frame = new THREE.BoxGeometry(4, 4, 0.5);
  const frameMesh = new THREE.Mesh(frame, frameMat);
  group.add(frameMesh);
  
  const door = new THREE.BoxGeometry(3, 3.5, 0.3);
  const doorMesh = new THREE.Mesh(door, doorMat);
  doorMesh.position.z = 0.15; // Move slightly forward to avoid Z-fight with frame
  group.add(doorMesh);
  
  // Add some stripes
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x4444ff });
  for (let i = 0; i < 3; i++) {
    const stripe = new THREE.BoxGeometry(2.5, 0.1, 0.05);
    const stripeMesh = new THREE.Mesh(stripe, stripeMat);
    stripeMesh.position.set(0, -1 + i * 1, 0.31); // Move forward to avoid Z-fight with door
    group.add(stripeMesh);
  }
  
  return group;
}

export function createVerticallySegmentedWallGeometry() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.4, roughness: 0.6 });
  
  // 5 vertical segments
  for (let i = 0; i < 5; i++) {
    const geo = new THREE.BoxGeometry(0.7, 4, 0.5);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.x = -1.6 + i * 0.8;
    // Alternate depth slightly
    mesh.position.z = (i % 2 === 0) ? 0 : 0.1;
    group.add(mesh);
  }
  
  return group;
}

export function createLampWallGeometry() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const base = new THREE.BoxGeometry(4, 4, 4);
  const mesh = new THREE.Mesh(base, material);
  group.add(mesh);
  
  // Add some vertical panels
  for (let i = 0; i < 4; i++) {
    const panelGeo = new THREE.BoxGeometry(0.1, 3.8, 4.1);
    const panel = new THREE.Mesh(panelGeo, new THREE.MeshStandardMaterial({ color: 0x222222 }));
    panel.position.x = -1.5 + i * 1;
    group.add(panel);
  }
  
  return group;
}

export function createServiceTunnelGeometry() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.4 });
  
  // Floor of the tunnel (lower than normal floor)
  const floor = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 4), material);
  floor.position.y = -2.5;
  group.add(floor);
  
  // Walls of the tunnel
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 4), material);
  leftWall.position.set(-1.9, -2, 0);
  group.add(leftWall);
  
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 4), material);
  rightWall.position.set(1.9, -2, 0);
  group.add(rightWall);
  
  // Grate on top (at normal floor level)
  const grateMat = new THREE.MeshStandardMaterial({ color: 0x444444, transparent: true, opacity: 0.7 });
  for (let i = 0; i < 8; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.1, 0.1), grateMat);
    bar.position.set(0, -1.5, -1.75 + i * 0.5);
    group.add(bar);
  }
  
  return group;
}

export function createNeonTubeGeometry(color: number) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const neonMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, //color, 
    emissive: 0xffffff, 
    emissiveIntensity: 15 
  });
  
  // Fixture
  const fixture = new THREE.BoxGeometry(3, 0.2, 0.2);
  const fixtureMesh = new THREE.Mesh(fixture, material);
  group.add(fixtureMesh);
  
  // Tube
  const tube = new THREE.CylinderGeometry(0.05, 0.05, 2.8, 8);
  const tubeMesh = new THREE.Mesh(tube, neonMat);
  tubeMesh.rotation.z = Math.PI / 2;
  tubeMesh.position.y = -0.1;
  group.add(tubeMesh);
  
  return group;
}

export function createNeonCornerWallGeometry() {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x333333 }); //, metalness: 0.8, roughness: 0.2 });
  const neonMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    emissive: 0xffffff, 
    emissiveIntensity: 20 
  });
  
  // Main wall block
  const wall = new THREE.BoxGeometry(4, 4, 4);
  const wallMesh = new THREE.Mesh(wall, wallMat);
  group.add(wallMesh);
  
  // Vertical neon tube at corner
  const tube = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
  const tubeMesh = new THREE.Mesh(tube, neonMat);
  tubeMesh.position.set(2.0, 0, 2.0);
  group.add(tubeMesh);

  return group;
}

export function createVaporwaveFloorGeometry() {
  const group = new THREE.Group();
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x050505 });
  const gridMat = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 2 });
  
  const floor = new THREE.PlaneGeometry(4, 4);
  const floorMesh = new THREE.Mesh(floor, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = -2;
  group.add(floorMesh);
  
  // Grid lines (outline)
  const lineSize = 0.05;
  const lines = [
    { w: 4, h: lineSize, x: 0, z: -1.95 },
    { w: 4, h: lineSize, x: 0, z: 1.95 },
    { w: lineSize, h: 4, x: -1.95, z: 0 },
    { w: lineSize, h: 4, x: 1.95, z: 0 }
  ];
  
  lines.forEach(l => {
    const line = new THREE.PlaneGeometry(l.w, l.h);
    const lineMesh = new THREE.Mesh(line, gridMat);
    lineMesh.rotation.x = -Math.PI / 2;
    lineMesh.position.set(l.x, -1.99, l.z);
    group.add(lineMesh);
  });
  
  return group;
}

export function createPosterGeometry(type: 'motivational' | 'warning') {
  const group = new THREE.Group();
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  
  // Background
  ctx.fillStyle = type === 'motivational' ? '#f0f0f0' : '#ffff00';
  ctx.fillRect(0, 0, 128, 128);
  
  // Border
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 124, 124);
  
  // Simple graphics
  if (type === 'motivational') {
    ctx.fillStyle = '#444';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('KEEP', 64, 40);
    ctx.fillText('CLEAN', 64, 60);
    ctx.fillStyle = '#00f';
    ctx.beginPath();
    ctx.arc(64, 90, 20, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WARNING', 64, 40);
    ctx.beginPath();
    ctx.moveTo(64, 60);
    ctx.lineTo(84, 100);
    ctx.lineTo(44, 100);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffff00';
    ctx.fillText('!', 64, 95);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide });
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  group.add(poster);
  
  return group;
}

export function createHullBreachGeometry() {
  const group = new THREE.Group();
  
  // Black smudge behind
  const smudgeMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.8 });
  const smudge = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), smudgeMat);
  smudge.position.z = -0.01;
  group.add(smudge);
  
  // Cracked steel geometry
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
  for (let i = 0; i < 5; i++) {
    const crack = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), steelMat);
    crack.rotation.z = (Math.random() - 0.5) * 2;
    crack.position.x = (Math.random() - 0.5) * 0.5;
    crack.position.y = (Math.random() - 0.5) * 0.5;
    group.add(crack);
  }
  
  return group;
}

export function createBulletImpactGeometry() {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.9 });
  const impact = new THREE.Mesh(new THREE.CircleGeometry(0.1, 8), material);
  group.add(impact);
  return group;
}

export function createClawMarkGeometry() {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0x221100, transparent: true, opacity: 0.7 });
  for (let i = 0; i < 3; i++) {
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.8), material);
    mark.position.x = -0.1 + i * 0.1;
    mark.rotation.z = 0.2;
    group.add(mark);
  }
  return group;
}

export function createCrackGeometry() {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
  for (let i = 0; i < 4; i++) {
    const crack = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 1), material);
    crack.rotation.z = Math.random() * Math.PI;
    group.add(crack);
  }
  return group;
}

export function createBulletShellGeometry() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0xaa8800, metalness: 0.9, roughness: 0.1 });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 6), material);
  shell.rotation.x = Math.PI / 2;
  group.add(shell);
  return group;
}

export function createSmudgeGeometry(color: number) {
  const group = new THREE.Group();
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  
  const c = new THREE.Color(color);
  const rgba = (a: number) => `rgba(${Math.floor(c.r * 255)}, ${Math.floor(c.g * 255)}, ${Math.floor(c.b * 255)}, ${a})`;
  
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, rgba(0.8));
  grad.addColorStop(0.7, rgba(0.4));
  grad.addColorStop(1, rgba(0));
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 32, 0, Math.PI * 2);
  ctx.fill();
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, blending: THREE.AdditiveBlending });
  const smudge = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  group.add(smudge);
  
  return group;
}

export function createGlowPlane(color: number, width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const c = new THREE.Color(color);
  const rgba = (a: number) => `rgba(${Math.floor(c.r * 255)}, ${Math.floor(c.g * 255)}, ${Math.floor(c.b * 255)}, ${a})`;
  
  // Clear canvas
  ctx.clearRect(0, 0, 32, 256);

  // Radial gradient for the core glow
  const radialGradient = ctx.createRadialGradient(16, 16, 2, 16, 16, 16);
  radialGradient.addColorStop(0, rgba(1.0));
  radialGradient.addColorStop(0.2, rgba(0.8));
  radialGradient.addColorStop(0.5, rgba(0.3));
  radialGradient.addColorStop(1, rgba(0));

  // Linear gradient for the long flare
  const linearGradient = ctx.createLinearGradient(0, 0, 0, 32);
  linearGradient.addColorStop(0, rgba(0));
  linearGradient.addColorStop(0.45, rgba(0.4));
  linearGradient.addColorStop(0.5, rgba(1.0));
  linearGradient.addColorStop(0.55, rgba(0.4));
  linearGradient.addColorStop(1, rgba(0));

  ctx.save();
  ctx.scale(1, 8); // Stretch vertically to 256
  
  // Draw radial glow
  ctx.fillStyle = radialGradient;
  ctx.fillRect(0, 0, 32, 32);
  
  // Draw linear flare (thinner and brighter)
  ctx.fillStyle = linearGradient;
  ctx.fillRect(8, 0, 16, 32);
  
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  
  const geometry = new THREE.PlaneGeometry(width, height);
  return new THREE.Mesh(geometry, material);
}
