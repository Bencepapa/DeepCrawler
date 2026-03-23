import * as THREE from 'three';
import { TILE_SIZE } from './constants';

export enum EnemyType {
  SWARM = 'swarm',
  DRONE = 'drone',
}

export interface Enemy {
  id: string;
  type: EnemyType;
  pos: { x: number; z: number };
  mesh: THREE.Object3D;
  hp: number;
}

export function createSwarmMesh() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x330000 });
  
  for (let i = 0; i < 5; i++) {
    const geo = new THREE.SphereGeometry(0.1, 8, 8);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5
    );
    group.add(mesh);
  }
  
  return group;
}

export function createDroneMesh() {
  const group = new THREE.Group();
  const bodyGeo = new THREE.OctahedronGeometry(0.4);
  const material = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 1, roughness: 0 });
  const body = new THREE.Mesh(bodyGeo, material);
  group.add(body);
  
  const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000 });
  const eye = new THREE.Mesh(eyeGeo, eyeMat);
  eye.position.z = 0.35;
  group.add(eye);
  
  return group;
}
