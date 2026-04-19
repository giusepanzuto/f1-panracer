import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import {
  TRACK_CURVE_RADIUS,
  TRACK_STRAIGHT,
  TRACK_WIDTH,
  WALL_HEIGHT,
} from '../config/tuning';

const STRAIGHT_SEGMENTS = 16;
const CURVE_SEGMENTS = 32;
const WALL_RADIUS = WALL_HEIGHT / 2;

export class Track {
  readonly startPosition: Vector3;
  readonly startHeading: number;

  constructor(scene: Scene) {
    const halfWidth = TRACK_WIDTH / 2;
    const innerPath = buildOvalPath(
      TRACK_STRAIGHT,
      TRACK_CURVE_RADIUS - halfWidth,
    );
    const outerPath = buildOvalPath(
      TRACK_STRAIGHT,
      TRACK_CURVE_RADIUS + halfWidth,
    );

    const asphaltMat = new StandardMaterial('asphalt-mat', scene);
    asphaltMat.diffuseColor = new Color3(0.18, 0.2, 0.24);
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

    const outerWall = MeshBuilder.CreateTube(
      'outer-wall',
      { path: liftPath(outerPath), radius: WALL_RADIUS, cap: 0 },
      scene,
    );
    outerWall.material = wallMat;

    this.startPosition = new Vector3(
      -TRACK_STRAIGHT / 2,
      0.25,
      TRACK_CURVE_RADIUS,
    );
    this.startHeading = Math.PI / 2;
  }
}

function buildOvalPath(straight: number, radius: number): Vector3[] {
  const points: Vector3[] = [];
  const halfStraight = straight / 2;

  for (let i = 0; i < STRAIGHT_SEGMENTS; i++) {
    const t = i / STRAIGHT_SEGMENTS;
    points.push(new Vector3(-halfStraight + straight * t, 0, radius));
  }

  for (let i = 0; i < CURVE_SEGMENTS; i++) {
    const a = Math.PI / 2 - (i / CURVE_SEGMENTS) * Math.PI;
    points.push(
      new Vector3(halfStraight + Math.cos(a) * radius, 0, Math.sin(a) * radius),
    );
  }

  for (let i = 0; i < STRAIGHT_SEGMENTS; i++) {
    const t = i / STRAIGHT_SEGMENTS;
    points.push(new Vector3(halfStraight - straight * t, 0, -radius));
  }

  for (let i = 0; i < CURVE_SEGMENTS; i++) {
    const a = -Math.PI / 2 - (i / CURVE_SEGMENTS) * Math.PI;
    points.push(
      new Vector3(-halfStraight + Math.cos(a) * radius, 0, Math.sin(a) * radius),
    );
  }

  return points;
}
