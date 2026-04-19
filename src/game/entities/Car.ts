import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import type { Mesh } from '@babylonjs/core';
import { MOVE_SPEED_UPS, TURN_SPEED_RADS } from '../config/tuning';
import type { InputAxes } from '../systems/InputSystem';

export class Car {
  readonly position = new Vector3(0, 0.25, 0);
  heading = 0;

  private readonly mesh: Mesh;

  constructor(scene: Scene) {
    this.mesh = MeshBuilder.CreateBox(
      'car',
      { width: 1, height: 0.5, depth: 2 },
      scene,
    );
    const mat = new StandardMaterial('car-mat', scene);
    mat.diffuseColor = new Color3(0.9, 0.15, 0.2);
    mat.specularColor = Color3.Black();
    this.mesh.material = mat;

    this.syncTransform();
  }

  update(dt: number, input: InputAxes): void {
    this.heading += input.steer * TURN_SPEED_RADS * dt;

    const forwardX = Math.sin(this.heading);
    const forwardZ = Math.cos(this.heading);
    const step = input.throttle * MOVE_SPEED_UPS * dt;
    this.position.x += forwardX * step;
    this.position.z += forwardZ * step;

    this.syncTransform();
  }

  private syncTransform(): void {
    this.mesh.position.copyFrom(this.position);
    this.mesh.rotation.y = this.heading;
  }
}
