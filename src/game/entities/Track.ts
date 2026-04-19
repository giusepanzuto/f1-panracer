import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import type { Mesh } from '@babylonjs/core';
import {
  COLLISION_RADIUS,
  TRACK_WIDTH,
  WALL_HEIGHT,
} from '../config/tuning';

const WALL_RADIUS = WALL_HEIGHT / 2;

export type Segment2D = {
  ax: number;
  az: number;
  bx: number;
  bz: number;
};

type Cursor = { pos: Vector3; heading: number };

export class Track {
  readonly startPosition: Vector3;
  readonly startHeading: number;
  readonly finishLine: Segment2D;
  readonly checkpointLine: Segment2D;
  readonly centerline: Vector3[];

  private readonly meshes: Mesh[] = [];

  constructor(scene: Scene, centerline?: Vector3[]) {
    const center = centerline
      ? normalizeOrientation(centerline)
      : buildMonzaCenterline();
    this.centerline = center;

    const halfWidth = TRACK_WIDTH / 2;
    const innerPath = offsetPath(center, -halfWidth);
    const outerPath = offsetPath(center, halfWidth);

    const grassMat = new StandardMaterial('grass-mat', scene);
    grassMat.diffuseColor = new Color3(0.33, 0.58, 0.28);
    grassMat.specularColor = Color3.Black();
    const grass = MeshBuilder.CreateGround(
      'grass',
      { width: 800, height: 800 },
      scene,
    );
    grass.position.y = -0.01;
    grass.material = grassMat;
    this.meshes.push(grass);

    const asphaltMat = new StandardMaterial('asphalt-mat', scene);
    asphaltMat.diffuseColor = new Color3(0.14, 0.15, 0.18);
    asphaltMat.specularColor = Color3.Black();

    const asphalt = MeshBuilder.CreateRibbon(
      'asphalt',
      {
        pathArray: [outerPath, innerPath],
        closePath: true,
        sideOrientation: 2,
      },
      scene,
    );
    asphalt.material = asphaltMat;
    this.meshes.push(asphalt);

    const wallMat = new StandardMaterial('wall-mat', scene);
    wallMat.diffuseColor = new Color3(0.95, 0.75, 0.2);
    wallMat.specularColor = Color3.Black();

    const liftPath = (path: Vector3[]): Vector3[] => [
      ...path.map((p) => new Vector3(p.x, WALL_RADIUS, p.z)),
      new Vector3(path[0].x, WALL_RADIUS, path[0].z),
    ];

    const innerWall = MeshBuilder.CreateTube(
      'inner-wall',
      { path: liftPath(innerPath), radius: WALL_RADIUS, cap: 0 },
      scene,
    );
    innerWall.material = wallMat;
    this.meshes.push(innerWall);

    const outerWall = MeshBuilder.CreateTube(
      'outer-wall',
      { path: liftPath(outerPath), radius: WALL_RADIUS, cap: 0 },
      scene,
    );
    outerWall.material = wallMat;
    this.meshes.push(outerWall);

    const startTangent = tangentAt(center, 0);
    this.startHeading = Math.atan2(startTangent.x, startTangent.z);
    this.startPosition = new Vector3(center[0].x, 0.25, center[0].z);

    this.finishLine = lineAcross(center[0], this.startHeading, halfWidth);
    const checkpointIndex = Math.floor(center.length / 2);
    const checkpointTangent = tangentAt(center, checkpointIndex);
    const checkpointHeading = Math.atan2(
      checkpointTangent.x,
      checkpointTangent.z,
    );
    this.checkpointLine = lineAcross(
      center[checkpointIndex],
      checkpointHeading,
      halfWidth,
    );

    const finishLineMat = new StandardMaterial('finish-line-mat', scene);
    finishLineMat.diffuseColor = new Color3(0.95, 0.95, 0.95);
    finishLineMat.specularColor = Color3.Black();
    const finishBox = MeshBuilder.CreateBox(
      'finish-line',
      { width: 1, height: 0.02, depth: TRACK_WIDTH },
      scene,
    );
    finishBox.position.set(center[0].x, 0.02, center[0].z);
    finishBox.rotation.y = this.startHeading - Math.PI / 2;
    finishBox.material = finishLineMat;
    this.meshes.push(finishBox);
  }

  dispose(): void {
    for (const mesh of this.meshes) {
      mesh.dispose();
    }
    this.meshes.length = 0;
  }

  clampToBounds(pos: Vector3): boolean {
    const halfWidth = TRACK_WIDTH / 2 - COLLISION_RADIUS;
    if (halfWidth <= 0) return false;

    let bestDist2 = Infinity;
    let bestProjX = 0;
    let bestProjZ = 0;
    let bestTx = 0;
    let bestTz = 1;

    const n = this.centerline.length;
    for (let i = 0; i < n; i++) {
      const a = this.centerline[i];
      const b = this.centerline[(i + 1) % n];
      const abx = b.x - a.x;
      const abz = b.z - a.z;
      const len2 = abx * abx + abz * abz;
      if (len2 === 0) continue;
      let t = ((pos.x - a.x) * abx + (pos.z - a.z) * abz) / len2;
      t = Math.max(0, Math.min(1, t));
      const projX = a.x + abx * t;
      const projZ = a.z + abz * t;
      const dx = pos.x - projX;
      const dz = pos.z - projZ;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestDist2) {
        bestDist2 = d2;
        bestProjX = projX;
        bestProjZ = projZ;
        const invLen = 1 / Math.sqrt(len2);
        bestTx = abx * invLen;
        bestTz = abz * invLen;
      }
    }

    const bestDist = Math.sqrt(bestDist2);
    if (bestDist <= halfWidth) return false;

    const nx = -bestTz;
    const nz = bestTx;
    const offX = pos.x - bestProjX;
    const offZ = pos.z - bestProjZ;
    const signedDist = offX * nx + offZ * nz;
    const clampedDist = Math.max(-halfWidth, Math.min(halfWidth, signedDist));
    pos.x = bestProjX + nx * clampedDist;
    pos.z = bestProjZ + nz * clampedDist;
    return true;
  }
}

function signedAreaXZ(points: Vector3[]): number {
  let sum = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const q = points[(i + 1) % n];
    sum += p.x * q.z - q.x * p.z;
  }
  return sum / 2;
}

function normalizeOrientation(points: Vector3[]): Vector3[] {
  if (signedAreaXZ(points) > 0) {
    return [...points].reverse();
  }
  return points;
}

function lineAcross(
  center: Vector3,
  heading: number,
  halfWidth: number,
): Segment2D {
  const rightX = Math.cos(heading);
  const rightZ = -Math.sin(heading);
  return {
    ax: center.x - rightX * halfWidth,
    az: center.z - rightZ * halfWidth,
    bx: center.x + rightX * halfWidth,
    bz: center.z + rightZ * halfWidth,
  };
}

function tangentAt(path: Vector3[], index: number): Vector3 {
  const n = path.length;
  const prev = path[(index - 1 + n) % n];
  const next = path[(index + 1) % n];
  const tx = next.x - prev.x;
  const tz = next.z - prev.z;
  const len = Math.hypot(tx, tz) || 1;
  return new Vector3(tx / len, 0, tz / len);
}

function offsetPath(center: Vector3[], offset: number): Vector3[] {
  const n = center.length;
  const out: Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const t = tangentAt(center, i);
    const nx = -t.z;
    const nz = t.x;
    out.push(
      new Vector3(
        center[i].x + nx * offset,
        center[i].y,
        center[i].z + nz * offset,
      ),
    );
  }
  return out;
}

function straight(
  out: Vector3[],
  cursor: Cursor,
  length: number,
  subdivisions = 8,
): Cursor {
  const sx = Math.sin(cursor.heading);
  const sz = Math.cos(cursor.heading);
  for (let i = 1; i <= subdivisions; i++) {
    const t = i / subdivisions;
    out.push(
      new Vector3(
        cursor.pos.x + sx * length * t,
        0,
        cursor.pos.z + sz * length * t,
      ),
    );
  }
  return {
    pos: new Vector3(
      cursor.pos.x + sx * length,
      0,
      cursor.pos.z + sz * length,
    ),
    heading: cursor.heading,
  };
}

function arc(
  out: Vector3[],
  cursor: Cursor,
  angle: number,
  radius: number,
): Cursor {
  const steps = Math.max(8, Math.ceil(Math.abs(angle) * 20));
  const dA = angle / steps;
  const arcStep = radius * Math.abs(dA);
  let x = cursor.pos.x;
  let z = cursor.pos.z;
  let h = cursor.heading;
  for (let i = 0; i < steps; i++) {
    h += dA / 2;
    x += Math.sin(h) * arcStep;
    z += Math.cos(h) * arcStep;
    h += dA / 2;
    out.push(new Vector3(x, 0, z));
  }
  return { pos: new Vector3(x, 0, z), heading: h };
}

function buildMonzaCenterline(): Vector3[] {
  const center: Vector3[] = [];
  const start = new Vector3(-150, 0, -60);
  center.push(start);
  let cur: Cursor = { pos: start.clone(), heading: Math.PI / 2 };

  cur = straight(center, cur, 70, 8);

  cur = arc(center, cur, 0.55, 12);
  cur = straight(center, cur, 6, 2);
  cur = arc(center, cur, -0.55, 12);

  cur = straight(center, cur, 18, 4);

  cur = arc(center, cur, 2.3, 48);

  cur = straight(center, cur, 30, 5);

  cur = arc(center, cur, -0.5, 10);
  cur = straight(center, cur, 8, 2);
  cur = arc(center, cur, 0.5, 10);

  cur = straight(center, cur, 20, 4);

  cur = arc(center, cur, 0.7, 18);

  cur = straight(center, cur, 12, 3);

  cur = arc(center, cur, 0.5, 22);

  cur = straight(center, cur, 30, 4);

  cur = arc(center, cur, -0.6, 10);
  cur = arc(center, cur, 1.2, 10);
  cur = arc(center, cur, -0.6, 10);

  cur = straight(center, cur, 47, 6);

  cur = arc(center, cur, 2.78, 58);

  const dx = start.x - cur.pos.x;
  const dz = start.z - cur.pos.z;
  const bridgeLen = Math.hypot(dx, dz);
  if (bridgeLen > 0.1) {
    const bridgeSteps = Math.max(4, Math.ceil(bridgeLen / 10));
    for (let i = 1; i < bridgeSteps; i++) {
      const t = i / bridgeSteps;
      center.push(
        new Vector3(cur.pos.x + dx * t, 0, cur.pos.z + dz * t),
      );
    }
  }

  return center;
}
