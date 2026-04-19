import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import type { Mesh } from '@babylonjs/core';
import {
  ACCEL_UPS2,
  BRAKE_UPS2,
  FRICTION_UPS2,
  MAX_REVERSE_UPS,
  MAX_SPEED_UPS,
  MAX_TURN_RADS,
} from '../config/tuning';
import type { InputAxes } from '../systems/InputSystem';

export class Car {
  readonly position = new Vector3(0, 0.25, 0);
  heading = 0;

  readonly root: Mesh;

  private speed = 0;

  constructor(scene: Scene) {
    this.root = MeshBuilder.CreateBox(
      'car',
      { width: 1, height: 0.5, depth: 2 },
      scene,
    );
    const mat = new StandardMaterial('car-mat', scene);
    mat.diffuseColor = new Color3(0.9, 0.15, 0.2);
    mat.specularColor = Color3.Black();
    this.root.material = mat;

    this.syncTransform();
  }

  update(dt: number, input: InputAxes): void {
    this.speed = this.integrateSpeed(dt, input.throttle);

    const speedRatio = this.speed / MAX_SPEED_UPS;
    this.heading += input.steer * MAX_TURN_RADS * speedRatio * dt;

    const forwardX = Math.sin(this.heading);
    const forwardZ = Math.cos(this.heading);
    this.position.x += forwardX * this.speed * dt;
    this.position.z += forwardZ * this.speed * dt;

    this.syncTransform();
  }

  private integrateSpeed(dt: number, throttle: number): number {
    let next = this.speed;
    if (throttle > 0) {
      next += ACCEL_UPS2 * throttle * dt;
    } else if (throttle < 0) {
      next += (this.speed > 0 ? BRAKE_UPS2 : ACCEL_UPS2) * throttle * dt;
    } else {
      const drag = FRICTION_UPS2 * dt;
      if (Math.abs(this.speed) <= drag) next = 0;
      else next -= Math.sign(this.speed) * drag;
    }
    return Math.max(-MAX_REVERSE_UPS, Math.min(MAX_SPEED_UPS, next));
  }

  private syncTransform(): void {
    this.root.position.copyFrom(this.position);
    this.root.rotation.y = this.heading;
  }
}
