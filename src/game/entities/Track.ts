import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
} from '@babylonjs/core';
import {
  TRACK_SIZE,
  WALL_HEIGHT,
  WALL_THICKNESS,
} from '../config/tuning';

export class Track {
  constructor(scene: Scene) {
    const groundMat = new StandardMaterial('track-ground-mat', scene);
    groundMat.diffuseColor = new Color3(0.18, 0.2, 0.24);
    groundMat.specularColor = Color3.Black();

    const ground = MeshBuilder.CreateGround(
      'track-ground',
      { width: TRACK_SIZE, height: TRACK_SIZE },
      scene,
    );
    ground.material = groundMat;

    const wallMat = new StandardMaterial('track-wall-mat', scene);
    wallMat.diffuseColor = new Color3(0.95, 0.75, 0.2);
    wallMat.specularColor = Color3.Black();

    const half = TRACK_SIZE / 2;
    const sides = [
      { x: 0, z: half, w: TRACK_SIZE, d: WALL_THICKNESS },
      { x: 0, z: -half, w: TRACK_SIZE, d: WALL_THICKNESS },
      { x: half, z: 0, w: WALL_THICKNESS, d: TRACK_SIZE },
      { x: -half, z: 0, w: WALL_THICKNESS, d: TRACK_SIZE },
    ];

    for (const s of sides) {
      const wall = MeshBuilder.CreateBox(
        'track-wall',
        { width: s.w, height: WALL_HEIGHT, depth: s.d },
        scene,
      );
      wall.position.set(s.x, WALL_HEIGHT / 2, s.z);
      wall.material = wallMat;
    }
  }
}
