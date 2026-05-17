import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { TRACK_WIDTH } from '../config/tuning';

const TIER_COUNT = 5;
const TIER_HEIGHT = 0.9;
const TIER_DEPTH = 1.6;
const STAND_LENGTH = 50;
const SPECTATORS_PER_TIER = 28;
const STAND_GAP_FROM_WALL = 4;

// Bias rosso Ferrari: il rosso compare due volte per dominare i tifosi
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

export class Grandstand {
  private readonly meshes: Mesh[] = [];
  private readonly materials: StandardMaterial[] = [];

  constructor(
    scene: Scene,
    centerPos: Vector3,
    heading: number,
    side: 1 | -1,
  ) {
    const tx = Math.sin(heading);
    const tz = Math.cos(heading);
    const px = Math.cos(heading) * side;
    const pz = -Math.sin(heading) * side;

    const baseOffset = TRACK_WIDTH / 2 + STAND_GAP_FROM_WALL;

    const structureMat = makeFlat(
      scene,
      'grandstand-mat',
      new Color3(0.72, 0.74, 0.78),
    );
    this.materials.push(structureMat);

    const shirtMats = SHIRT_COLORS.map((c, i) =>
      makeFlat(scene, `grandstand-shirt-${i}`, c),
    );
    const skinMats = SKIN_COLORS.map((c, i) =>
      makeFlat(scene, `grandstand-skin-${i}`, c),
    );
    this.materials.push(...shirtMats, ...skinMats);

    const tierBoxes: Mesh[] = [];
    const bodyBuckets: Mesh[][] = shirtMats.map(() => []);
    const headBuckets: Mesh[][] = skinMats.map(() => []);

    for (let t = 0; t < TIER_COUNT; t++) {
      const tierTopY = (t + 1) * TIER_HEIGHT;
      const tierFrontDist = baseOffset + t * TIER_DEPTH;
      const tierMidDist = tierFrontDist + TIER_DEPTH / 2;

      const tierCx = centerPos.x + px * tierMidDist;
      const tierCz = centerPos.z + pz * tierMidDist;
      const tier = MeshBuilder.CreateBox(
        `grandstand-tier-${t}`,
        { width: STAND_LENGTH, height: tierTopY, depth: TIER_DEPTH },
        scene,
      );
      tier.position.set(tierCx, tierTopY / 2, tierCz);
      tier.rotation.y = heading - Math.PI / 2;
      tierBoxes.push(tier);

      for (let i = 0; i < SPECTATORS_PER_TIER; i++) {
        const u = (i + 0.5) / SPECTATORS_PER_TIER - 0.5;
        const along = u * STAND_LENGTH * 0.94;
        const lateralJitter = (Math.random() - 0.5) * (TIER_DEPTH * 0.4);
        const perp = tierMidDist + lateralJitter;
        const sx = centerPos.x + tx * along + px * perp;
        const sz = centerPos.z + tz * along + pz * perp;

        const bodyH = 0.55 + Math.random() * 0.35;
        const bodyW = 0.36 + Math.random() * 0.1;
        const bodyD = 0.3 + Math.random() * 0.08;
        const headSize = 0.21 + Math.random() * 0.05;
        const yBase = tierTopY;

        const body = MeshBuilder.CreateBox(
          'spec-body',
          { width: bodyW, height: bodyH, depth: bodyD },
          scene,
        );
        body.position.set(sx, yBase + bodyH / 2, sz);
        const shirtIdx = Math.floor(Math.random() * shirtMats.length);
        bodyBuckets[shirtIdx].push(body);

        const head = MeshBuilder.CreateBox(
          'spec-head',
          { width: headSize, height: headSize, depth: headSize },
          scene,
        );
        head.position.set(sx, yBase + bodyH + headSize / 2, sz);
        const skinIdx = Math.floor(Math.random() * skinMats.length);
        headBuckets[skinIdx].push(head);
      }
    }

    mergeBucket(tierBoxes, 'grandstand-tiers', structureMat, this.meshes);
    for (let i = 0; i < bodyBuckets.length; i++) {
      mergeBucket(
        bodyBuckets[i],
        `grandstand-shirts-${i}`,
        shirtMats[i],
        this.meshes,
      );
    }
    for (let i = 0; i < headBuckets.length; i++) {
      mergeBucket(
        headBuckets[i],
        `grandstand-heads-${i}`,
        skinMats[i],
        this.meshes,
      );
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
