import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import type { Mesh, StandardMaterial as StdMat } from '@babylonjs/core';

const TREE_COUNT = 80;
const HILL_COUNT = 14;
const CLOUD_COUNT = 16;
const TREE_MIN_DIST_FROM_TRACK = 9;
const SCENERY_MARGIN = 90;

export class Scenery {
  private readonly meshes: Mesh[] = [];

  constructor(scene: Scene, centerline: ReadonlyArray<Vector3>) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const p of centerline) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }
    const sMinX = minX - SCENERY_MARGIN;
    const sMaxX = maxX + SCENERY_MARGIN;
    const sMinZ = minZ - SCENERY_MARGIN;
    const sMaxZ = maxZ + SCENERY_MARGIN;
    const centerBx = (minX + maxX) / 2;
    const centerBz = (minZ + maxZ) / 2;
    const hillRingRadius =
      Math.max(maxX - minX, maxZ - minZ) * 0.65 + SCENERY_MARGIN;

    const trunkMat = makeMat(scene, 'trunk-mat', new Color3(0.45, 0.27, 0.14));
    const leavesMat = makeMat(scene, 'leaves-mat', new Color3(0.2, 0.52, 0.18));
    const hillMat = makeMat(scene, 'hill-mat', new Color3(0.32, 0.6, 0.24));
    const cloudMat = makeMat(scene, 'cloud-mat', new Color3(0.96, 0.98, 1));

    let placed = 0;
    let attempts = 0;
    while (placed < TREE_COUNT && attempts < TREE_COUNT * 12) {
      attempts++;
      const x = sMinX + Math.random() * (sMaxX - sMinX);
      const z = sMinZ + Math.random() * (sMaxZ - sMinZ);
      if (distanceToTrack(x, z, centerline) < TREE_MIN_DIST_FROM_TRACK) continue;
      const scale = 0.7 + Math.random() * 1.1;
      this.buildTree(scene, x, z, scale, trunkMat, leavesMat);
      placed++;
    }

    for (let i = 0; i < HILL_COUNT; i++) {
      const angle = (i / HILL_COUNT) * Math.PI * 2 + Math.random() * 0.4;
      const r = hillRingRadius * (0.9 + Math.random() * 0.3);
      const x = centerBx + Math.cos(angle) * r;
      const z = centerBz + Math.sin(angle) * r;
      const size = 22 + Math.random() * 28;
      const height = 10 + Math.random() * 18;
      const hill = MeshBuilder.CreateBox(
        'hill',
        { width: size, height, depth: size },
        scene,
      );
      hill.position.set(x, height / 2 - 1, z);
      hill.material = hillMat;
      this.meshes.push(hill);
    }

    for (let i = 0; i < CLOUD_COUNT; i++) {
      const x = sMinX - 30 + Math.random() * (sMaxX - sMinX + 60);
      const z = sMinZ - 30 + Math.random() * (sMaxZ - sMinZ + 60);
      const y = 24 + Math.random() * 10;
      const w = 10 + Math.random() * 18;
      const cloud = MeshBuilder.CreateBox(
        'cloud',
        { width: w, height: 2.2, depth: w * 0.55 },
        scene,
      );
      cloud.position.set(x, y, z);
      cloud.material = cloudMat;
      this.meshes.push(cloud);
    }
  }

  dispose(): void {
    for (const m of this.meshes) m.dispose();
    this.meshes.length = 0;
  }

  private buildTree(
    scene: Scene,
    x: number,
    z: number,
    scale: number,
    trunkMat: StdMat,
    leavesMat: StdMat,
  ): void {
    const trunkH = 2.2 * scale;
    const trunk = MeshBuilder.CreateBox(
      'trunk',
      { width: 0.8 * scale, height: trunkH, depth: 0.8 * scale },
      scene,
    );
    trunk.position.set(x, trunkH / 2, z);
    trunk.material = trunkMat;
    this.meshes.push(trunk);

    const leavesSize = 2.4 * scale;
    const leaves = MeshBuilder.CreateBox(
      'leaves',
      { width: leavesSize, height: leavesSize, depth: leavesSize },
      scene,
    );
    leaves.position.set(x, trunkH + leavesSize / 2 - 0.4, z);
    leaves.material = leavesMat;
    this.meshes.push(leaves);
  }
}

function makeMat(scene: Scene, name: string, color: Color3): StdMat {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = color;
  mat.specularColor = Color3.Black();
  return mat;
}

function distanceToTrack(
  x: number,
  z: number,
  centerline: ReadonlyArray<Vector3>,
): number {
  let best = Infinity;
  const n = centerline.length;
  for (let i = 0; i < n; i++) {
    const a = centerline[i];
    const b = centerline[(i + 1) % n];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const len2 = abx * abx + abz * abz;
    if (len2 === 0) continue;
    let t = ((x - a.x) * abx + (z - a.z) * abz) / len2;
    t = Math.max(0, Math.min(1, t));
    const projX = a.x + abx * t;
    const projZ = a.z + abz * t;
    const dx = x - projX;
    const dz = z - projZ;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < best) best = d;
  }
  return best;
}
