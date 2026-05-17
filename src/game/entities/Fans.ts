import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { TRACK_WIDTH } from '../config/tuning';

const SHIRT_COLORS: Color3[] = [
  new Color3(0.85, 0.15, 0.15),
  new Color3(0.85, 0.15, 0.15),
  new Color3(0.95, 0.95, 0.95),
  new Color3(0.15, 0.55, 0.25),
  new Color3(0.15, 0.3, 0.6),
  new Color3(0.95, 0.85, 0.2),
  new Color3(0.95, 0.55, 0.15),
  new Color3(0.6, 0.3, 0.7),
];

const SKIN_COLORS: Color3[] = [
  new Color3(0.96, 0.83, 0.68),
  new Color3(0.85, 0.65, 0.5),
  new Color3(0.55, 0.38, 0.25),
  new Color3(0.42, 0.28, 0.18),
];

const CLUSTER_COUNT = 7;
const FANS_PER_CLUSTER = 18;
const CLUSTER_RADIUS_TANGENT = 3;
const CLUSTER_RADIUS_PERP = 1.2;
const OFFSET_FROM_WALL = 1.5;
const START_BUFFER = 35;

export class Fans {
  private readonly meshes: Mesh[] = [];
  private readonly materials: StandardMaterial[] = [];

  constructor(scene: Scene, centerline: Vector3[]) {
    const halfWidth = TRACK_WIDTH / 2;
    const offset = halfWidth + OFFSET_FROM_WALL;

    const totalLen = pathLength(centerline);

    const shirtMats = SHIRT_COLORS.map((c, i) =>
      makeFlat(scene, `fans-shirt-${i}`, c),
    );
    const skinMats = SKIN_COLORS.map((c, i) =>
      makeFlat(scene, `fans-skin-${i}`, c),
    );
    this.materials.push(...shirtMats, ...skinMats);

    const bodyBuckets: Mesh[][] = shirtMats.map(() => []);
    const headBuckets: Mesh[][] = skinMats.map(() => []);

    // Spazio utilizzabile: esclude un buffer attorno alla partenza
    // per non sovrapporsi alla tribuna
    const usable = Math.max(totalLen * 0.5, totalLen - 2 * START_BUFFER);
    const startArc = (totalLen - usable) / 2;
    const stride = usable / CLUSTER_COUNT;

    for (let c = 0; c < CLUSTER_COUNT; c++) {
      const arc = startArc + (c + 0.5) * stride;
      const sample = sampleAt(centerline, arc);
      const heading = Math.atan2(sample.tx, sample.tz);
      const px = -Math.cos(heading);
      const pz = Math.sin(heading);
      const tx = Math.sin(heading);
      const tz = Math.cos(heading);

      const cx = sample.x + px * offset;
      const cz = sample.z + pz * offset;

      for (let i = 0; i < FANS_PER_CLUSTER; i++) {
        const along = (Math.random() - 0.5) * 2 * CLUSTER_RADIUS_TANGENT;
        const perp = Math.random() * CLUSTER_RADIUS_PERP;
        const fx = cx + tx * along + px * perp;
        const fz = cz + tz * along + pz * perp;

        const bodyH = 1.0 + Math.random() * 0.3;
        const bodyW = 0.38 + Math.random() * 0.1;
        const bodyD = 0.3 + Math.random() * 0.08;
        const headSize = 0.24 + Math.random() * 0.05;

        const body = MeshBuilder.CreateBox(
          'fan-body',
          { width: bodyW, height: bodyH, depth: bodyD },
          scene,
        );
        body.position.set(fx, bodyH / 2, fz);
        const shirtIdx = Math.floor(Math.random() * shirtMats.length);
        bodyBuckets[shirtIdx].push(body);

        const head = MeshBuilder.CreateBox(
          'fan-head',
          { width: headSize, height: headSize, depth: headSize },
          scene,
        );
        head.position.set(fx, bodyH + headSize / 2, fz);
        const skinIdx = Math.floor(Math.random() * skinMats.length);
        headBuckets[skinIdx].push(head);
      }
    }

    for (let i = 0; i < bodyBuckets.length; i++) {
      mergeBucket(bodyBuckets[i], `fans-shirts-${i}`, shirtMats[i], this.meshes);
    }
    for (let i = 0; i < headBuckets.length; i++) {
      mergeBucket(headBuckets[i], `fans-heads-${i}`, skinMats[i], this.meshes);
    }
  }

  dispose(): void {
    for (const m of this.meshes) m.dispose();
    for (const m of this.materials) m.dispose();
    this.meshes.length = 0;
    this.materials.length = 0;
  }
}

function makeFlat(
  scene: Scene,
  name: string,
  color: Color3,
): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = color;
  m.specularColor = Color3.Black();
  return m;
}

function mergeBucket(
  meshes: Mesh[],
  name: string,
  material: StandardMaterial,
  out: Mesh[],
): void {
  if (meshes.length === 0) return;
  const merged = Mesh.MergeMeshes(meshes, true, true, undefined, false, false);
  if (merged) {
    merged.name = name;
    merged.material = material;
    out.push(merged);
  }
}

function pathLength(path: Vector3[]): number {
  let total = 0;
  const n = path.length;
  for (let i = 0; i < n; i++) {
    const a = path[i];
    const b = path[(i + 1) % n];
    total += Math.hypot(b.x - a.x, b.z - a.z);
  }
  return total;
}

function sampleAt(
  path: Vector3[],
  targetArc: number,
): { x: number; z: number; tx: number; tz: number } {
  const n = path.length;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const a = path[i];
    const b = path[(i + 1) % n];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    if (acc + len >= targetArc) {
      const t = (targetArc - acc) / len;
      const invLen = 1 / len;
      return {
        x: a.x + dx * t,
        z: a.z + dz * t,
        tx: dx * invLen,
        tz: dz * invLen,
      };
    }
    acc += len;
  }
  const a = path[n - 1];
  const b = path[0];
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  return { x: a.x, z: a.z, tx: dx / len, tz: dz / len };
}
