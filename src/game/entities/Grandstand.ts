import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import type { Mesh, StandardMaterial as StdMat } from '@babylonjs/core';
import { TRACK_WIDTH } from '../config/tuning';

const TIER_COUNT = 5;
const TIER_HEIGHT = 0.9;
const TIER_DEPTH = 1.6;
const STAND_LENGTH = 50;
const SPECTATORS_PER_TIER = 28;
const SPECTATOR_W = 0.5;
const SPECTATOR_BASE_H = 0.85;
const STAND_GAP_FROM_WALL = 4;

// Bias rosso Ferrari: il rosso compare due volte per dominare i tifosi
const CROWD_COLORS: Color3[] = [
  new Color3(0.85, 0.15, 0.15),
  new Color3(0.85, 0.15, 0.15),
  new Color3(0.95, 0.95, 0.95),
  new Color3(0.15, 0.55, 0.25),
  new Color3(0.15, 0.3, 0.6),
  new Color3(0.95, 0.85, 0.2),
  new Color3(0.95, 0.55, 0.15),
  new Color3(0.6, 0.3, 0.7),
];

export class Grandstand {
  private readonly meshes: Mesh[] = [];

  constructor(
    scene: Scene,
    centerPos: Vector3,
    heading: number,
    side: 1 | -1,
  ) {
    const tx = Math.sin(heading);
    const tz = Math.cos(heading);
    // perpendicolare al tangente: side=+1 destra, side=-1 sinistra (esterno loop CW)
    const px = Math.cos(heading) * side;
    const pz = -Math.sin(heading) * side;

    const baseOffset = TRACK_WIDTH / 2 + STAND_GAP_FROM_WALL;

    const structureMat = new StandardMaterial('grandstand-mat', scene);
    structureMat.diffuseColor = new Color3(0.72, 0.74, 0.78);
    structureMat.specularColor = Color3.Black();

    const crowdMats: StdMat[] = CROWD_COLORS.map((c, i) => {
      const m = new StandardMaterial(`grandstand-crowd-mat-${i}`, scene);
      m.diffuseColor = c;
      m.specularColor = Color3.Black();
      return m;
    });

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
      tier.material = structureMat;
      this.meshes.push(tier);

      for (let i = 0; i < SPECTATORS_PER_TIER; i++) {
        const u = (i + 0.5) / SPECTATORS_PER_TIER - 0.5;
        const along = u * STAND_LENGTH * 0.94;
        const lateralJitter = (Math.random() - 0.5) * (TIER_DEPTH * 0.4);
        const perp = tierMidDist + lateralJitter;
        const sx = centerPos.x + tx * along + px * perp;
        const sz = centerPos.z + tz * along + pz * perp;

        const heightVar = 0.85 + Math.random() * 0.45;
        const height = SPECTATOR_BASE_H * heightVar;
        const sy = tierTopY + height / 2;

        const spectator = MeshBuilder.CreateBox(
          `grandstand-spectator-${t}-${i}`,
          { width: SPECTATOR_W, height, depth: SPECTATOR_W },
          scene,
        );
        spectator.position.set(sx, sy, sz);
        spectator.material =
          crowdMats[Math.floor(Math.random() * crowdMats.length)];
        this.meshes.push(spectator);
      }
    }
  }

  dispose(): void {
    for (const m of this.meshes) m.dispose();
    this.meshes.length = 0;
  }
}
