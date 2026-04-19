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
  SPEED_DISPLAY_FACTOR,
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
    mat.diffuseColor = new Color3(0.92, 0.12, 0.16);
    mat.specularColor = Color3.Black();
    this.root.material = mat;

    const wheelMat = new StandardMaterial('wheel-mat', scene);
    wheelMat.diffuseColor = new Color3(0.08, 0.08, 0.08);
    wheelMat.specularColor = Color3.Black();

    const frontWheelOffsets = [
      new Vector3(-0.55, -0.05, 0.8),
      new Vector3(0.55, -0.05, 0.8),
    ];
    for (const offset of frontWheelOffsets) {
      const wheel = MeshBuilder.CreateCylinder(
        'wheel-front',
        { height: 0.2, diameter: 0.4 },
        scene,
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.copyFrom(offset);
      wheel.material = wheelMat;
      wheel.parent = this.root;
    }

    const rearWheelOffsets = [
      new Vector3(-0.58, 0.025, -0.8),
      new Vector3(0.58, 0.025, -0.8),
    ];
    for (const offset of rearWheelOffsets) {
      const wheel = MeshBuilder.CreateCylinder(
        'wheel-rear',
        { height: 0.28, diameter: 0.55 },
        scene,
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.copyFrom(offset);
      wheel.material = wheelMat;
      wheel.parent = this.root;
    }

    const frontWing = MeshBuilder.CreateBox(
      'front-wing',
      { width: 1.4, height: 0.06, depth: 0.35 },
      scene,
    );
    frontWing.position.set(0, -0.1, 1.05);
    frontWing.material = mat;
    frontWing.parent = this.root;

    const rearWingSupport = MeshBuilder.CreateBox(
      'rear-wing-support',
      { width: 0.12, height: 0.35, depth: 0.1 },
      scene,
    );
    rearWingSupport.position.set(0, 0.35, -0.95);
    rearWingSupport.material = mat;
    rearWingSupport.parent = this.root;

    const rearWing = MeshBuilder.CreateBox(
      'rear-wing',
      { width: 0.95, height: 0.08, depth: 0.22 },
      scene,
    );
    rearWing.position.set(0, 0.5, -1.0);
    rearWing.material = mat;
    rearWing.parent = this.root;

    const cockpitMat = new StandardMaterial('cockpit-mat', scene);
    cockpitMat.diffuseColor = new Color3(0.05, 0.05, 0.06);
    cockpitMat.specularColor = Color3.Black();
    const cockpit = MeshBuilder.CreateBox(
      'cockpit',
      { width: 0.35, height: 0.08, depth: 0.6 },
      scene,
    );
    cockpit.position.set(0, 0.29, 0.05);
    cockpit.material = cockpitMat;
    cockpit.parent = this.root;

    this.syncTransform();
  }

  dampSpeed(factor: number): void {
    this.speed *= factor;
  }

  get speedKmh(): number {
    return Math.abs(this.speed) * SPEED_DISPLAY_FACTOR;
  }

  reset(pos: Vector3, heading: number): void {
    this.position.copyFrom(pos);
    this.heading = heading;
    this.speed = 0;
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
