import {
  Color3,
  DynamicTexture,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
} from '@babylonjs/core';
import type { Mesh, StandardMaterial as StdMat } from '@babylonjs/core';
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
    const bodyMat = makeFlat(scene, 'body-mat', new Color3(0.92, 0.1, 0.14));
    const bodyDarkMat = makeFlat(scene, 'body-dark-mat', new Color3(0.6, 0.07, 0.1));
    const chromeMat = makeFlat(scene, 'chrome-mat', new Color3(0.78, 0.8, 0.85));
    const blackMat = makeFlat(scene, 'black-mat', new Color3(0.05, 0.05, 0.06));
    const helmetMat = makeFlat(scene, 'helmet-mat', new Color3(0.95, 0.85, 0.15));
    const wheelMat = makeFlat(scene, 'wheel-mat', new Color3(0.08, 0.08, 0.08));
    const rimMat = makeFlat(scene, 'rim-mat', new Color3(0.7, 0.72, 0.78));

    const sponsorTex = makeSponsorTexture(scene);
    const sponsorMat = new StandardMaterial('sponsor-mat', scene);
    sponsorMat.diffuseTexture = sponsorTex;
    sponsorMat.specularColor = Color3.Black();
    sponsorMat.backFaceCulling = false;

    this.root = MeshBuilder.CreateBox(
      'chassis',
      { width: 0.8, height: 0.32, depth: 2.1 },
      scene,
    );
    this.root.material = bodyMat;

    const nose = MeshBuilder.CreateCylinder(
      'nose',
      {
        diameterTop: 0.08,
        diameterBottom: 0.34,
        height: 0.8,
        tessellation: 16,
      },
      scene,
    );
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, -0.04, 1.35);
    nose.material = bodyMat;
    nose.parent = this.root;

    const sidepodOffsets = [
      new Vector3(-0.48, -0.02, -0.1),
      new Vector3(0.48, -0.02, -0.1),
    ];
    for (const off of sidepodOffsets) {
      const sidepod = MeshBuilder.CreateCapsule(
        'sidepod',
        {
          radius: 0.15,
          height: 1.2,
          tessellation: 16,
          orientation: new Vector3(0, 0, 1),
        },
        scene,
      );
      sidepod.position.copyFrom(off);
      sidepod.material = bodyDarkMat;
      sidepod.parent = this.root;
    }

    const cockpit = MeshBuilder.CreateBox(
      'cockpit',
      { width: 0.32, height: 0.07, depth: 0.55 },
      scene,
    );
    cockpit.position.set(0, 0.19, 0.1);
    cockpit.material = blackMat;
    cockpit.parent = this.root;

    const helmet = MeshBuilder.CreateSphere(
      'helmet',
      { diameter: 0.24, segments: 12 },
      scene,
    );
    helmet.scaling.z = 1.15;
    helmet.position.set(0, 0.33, 0.08);
    helmet.material = helmetMat;
    helmet.parent = this.root;

    const visor = MeshBuilder.CreateBox(
      'visor',
      { width: 0.23, height: 0.06, depth: 0.02 },
      scene,
    );
    visor.position.set(0, 0.35, 0.19);
    visor.material = blackMat;
    visor.parent = this.root;

    const haloFront = MeshBuilder.CreateBox(
      'halo-front',
      { width: 0.42, height: 0.04, depth: 0.04 },
      scene,
    );
    haloFront.position.set(0, 0.46, 0.28);
    haloFront.material = chromeMat;
    haloFront.parent = this.root;

    const haloLeft = MeshBuilder.CreateBox(
      'halo-left',
      { width: 0.035, height: 0.035, depth: 0.72 },
      scene,
    );
    haloLeft.position.set(-0.2, 0.44, -0.05);
    haloLeft.material = chromeMat;
    haloLeft.parent = this.root;

    const haloRight = haloLeft.clone('halo-right');
    haloRight.position.set(0.2, 0.44, -0.05);

    const airbox = MeshBuilder.CreateBox(
      'airbox',
      { width: 0.3, height: 0.32, depth: 0.5 },
      scene,
    );
    airbox.position.set(0, 0.32, -0.45);
    airbox.material = bodyMat;
    airbox.parent = this.root;

    const airboxIntake = MeshBuilder.CreateBox(
      'airbox-intake',
      { width: 0.18, height: 0.12, depth: 0.04 },
      scene,
    );
    airboxIntake.position.set(0, 0.38, -0.22);
    airboxIntake.material = blackMat;
    airboxIntake.parent = this.root;

    const engineCover = MeshBuilder.CreateBox(
      'engine-cover',
      { width: 0.45, height: 0.12, depth: 0.5 },
      scene,
    );
    engineCover.position.set(0, 0.22, -0.78);
    engineCover.material = bodyMat;
    engineCover.parent = this.root;

    const frontWing = MeshBuilder.CreateBox(
      'front-wing',
      { width: 1.25, height: 0.05, depth: 0.32 },
      scene,
    );
    frontWing.position.set(0, -0.12, 1.2);
    frontWing.material = bodyMat;
    frontWing.parent = this.root;

    const frontWingFlap = MeshBuilder.CreateBox(
      'front-wing-flap',
      { width: 1.1, height: 0.03, depth: 0.18 },
      scene,
    );
    frontWingFlap.position.set(0, -0.08, 1.32);
    frontWingFlap.material = bodyMat;
    frontWingFlap.parent = this.root;

    for (const sx of [-1, 1]) {
      const fwEndplate = MeshBuilder.CreateBox(
        'fw-endplate',
        { width: 0.05, height: 0.22, depth: 0.34 },
        scene,
      );
      fwEndplate.position.set(sx * 0.62, -0.03, 1.22);
      fwEndplate.material = chromeMat;
      fwEndplate.parent = this.root;
    }

    const rearWingSupport = MeshBuilder.CreateBox(
      'rear-wing-support',
      { width: 0.1, height: 0.4, depth: 0.08 },
      scene,
    );
    rearWingSupport.position.set(0, 0.38, -1.0);
    rearWingSupport.material = chromeMat;
    rearWingSupport.parent = this.root;

    const rearWingBeam = MeshBuilder.CreateBox(
      'rear-wing-beam',
      { width: 0.65, height: 0.05, depth: 0.2 },
      scene,
    );
    rearWingBeam.position.set(0, 0.25, -1.05);
    rearWingBeam.material = bodyMat;
    rearWingBeam.parent = this.root;

    const rearWing = MeshBuilder.CreateBox(
      'rear-wing',
      { width: 0.9, height: 0.06, depth: 0.25 },
      scene,
    );
    rearWing.position.set(0, 0.58, -1.02);
    rearWing.material = bodyMat;
    rearWing.parent = this.root;

    for (const sx of [-1, 1]) {
      const rwEndplate = MeshBuilder.CreateBox(
        'rw-endplate',
        { width: 0.04, height: 0.55, depth: 0.3 },
        scene,
      );
      rwEndplate.position.set(sx * 0.45, 0.33, -1.02);
      rwEndplate.material = chromeMat;
      rwEndplate.parent = this.root;
    }

    for (const sx of [-1, 1]) {
      const exhaust = MeshBuilder.CreateCylinder(
        'exhaust',
        { height: 0.24, diameter: 0.08 },
        scene,
      );
      exhaust.rotation.x = Math.PI / 2;
      exhaust.position.set(sx * 0.12, 0.18, -1.1);
      exhaust.material = chromeMat;
      exhaust.parent = this.root;
    }

    for (const sx of [-1, 1]) {
      const decal = MeshBuilder.CreatePlane(
        'livery-decal',
        { width: 1.1, height: 0.24, sideOrientation: 2 },
        scene,
      );
      decal.position.set(sx * 0.64, -0.02, -0.1);
      decal.rotation.y = sx * Math.PI * 0.5;
      decal.material = sponsorMat;
      decal.parent = this.root;
    }

    const airboxDecal = MeshBuilder.CreatePlane(
      'airbox-decal',
      { width: 0.28, height: 0.22 },
      scene,
    );
    airboxDecal.position.set(0, 0.3, -0.2);
    airboxDecal.material = sponsorMat;
    airboxDecal.parent = this.root;

    const frontWheelOffsets = [
      new Vector3(-0.55, -0.05, 0.78),
      new Vector3(0.55, -0.05, 0.78),
    ];
    for (const offset of frontWheelOffsets) {
      this.buildWheel(scene, offset, 0.2, 0.4, wheelMat, rimMat, 'front');
    }

    const rearWheelOffsets = [
      new Vector3(-0.58, 0.025, -0.82),
      new Vector3(0.58, 0.025, -0.82),
    ];
    for (const offset of rearWheelOffsets) {
      this.buildWheel(scene, offset, 0.28, 0.55, wheelMat, rimMat, 'rear');
    }

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

  private buildWheel(
    scene: Scene,
    offset: Vector3,
    width: number,
    diameter: number,
    tireMat: StdMat,
    rimMat: StdMat,
    tag: string,
  ): void {
    const tire = MeshBuilder.CreateCylinder(
      `wheel-${tag}`,
      { height: width, diameter },
      scene,
    );
    tire.rotation.z = Math.PI / 2;
    tire.position.copyFrom(offset);
    tire.material = tireMat;
    tire.parent = this.root;

    const rim = MeshBuilder.CreateCylinder(
      `rim-${tag}`,
      { height: width * 1.02, diameter: diameter * 0.55 },
      scene,
    );
    rim.rotation.z = Math.PI / 2;
    rim.position.copyFrom(offset);
    rim.material = rimMat;
    rim.parent = this.root;
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

function makeFlat(scene: Scene, name: string, color: Color3): StdMat {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = color;
  mat.specularColor = Color3.Black();
  return mat;
}

function makeSponsorTexture(scene: Scene): DynamicTexture {
  const tex = new DynamicTexture(
    'sponsor-tex',
    { width: 512, height: 128 },
    scene,
    false,
  );
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;

  ctx.fillStyle = 'rgb(235,26,36)';
  ctx.fillRect(0, 0, 512, 128);

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 6, 512, 8);
  ctx.fillRect(0, 114, 512, 8);

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(70, 64, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.font = 'bold 58px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('7', 70, 66);

  ctx.fillStyle = '#fff';
  ctx.fillRect(140, 42, 130, 44);
  ctx.fillStyle = '#111';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText('TURBO', 205, 64);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PANRACER', 290, 72);

  ctx.fillStyle = '#ffdd2d';
  ctx.fillRect(460, 32, 38, 10);
  ctx.fillStyle = '#2dd4ff';
  ctx.fillRect(460, 48, 38, 10);
  ctx.fillStyle = '#fff';
  ctx.fillRect(460, 64, 38, 10);

  tex.update();
  tex.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
  return tex;
}
