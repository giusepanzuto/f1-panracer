import {
  Engine,
  FollowCamera,
  HemisphericLight,
  Scene,
  Vector3,
} from '@babylonjs/core';
import { Car } from '../entities/Car';
import { Track } from '../entities/Track';
import { InputSystem } from '../systems/InputSystem';
import { LapTimingSystem } from '../systems/LapTimingSystem';
import { COLLISION_DAMP } from '../config/tuning';
import { Hud } from '../../ui/Hud';

export class RaceScene {
  readonly scene: Scene;
  private readonly car: Car;
  private readonly track: Track;
  private readonly input: InputSystem;
  private readonly lapTiming: LapTimingSystem;
  private readonly hud: Hud;

  constructor(engine: Engine) {
    this.scene = new Scene(engine);
    this.scene.clearColor.set(0.05, 0.07, 0.12, 1);

    new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);

    this.track = new Track(this.scene);
    this.car = new Car(this.scene);
    this.car.position.copyFrom(this.track.startPosition);
    this.car.heading = this.track.startHeading;
    this.input = new InputSystem();
    this.lapTiming = new LapTimingSystem(this.track.startPosition.x);
    this.hud = new Hud();

    const camera = new FollowCamera(
      'camera',
      new Vector3(0, 5, -8),
      this.scene,
      this.car.root,
    );
    camera.radius = 8;
    camera.heightOffset = 3;
    camera.rotationOffset = 180;
    camera.cameraAcceleration = 0.05;
    camera.maxCameraSpeed = 20;

    this.scene.onBeforeRenderObservable.add(() => {
      const dt = engine.getDeltaTime() / 1000;
      this.car.update(dt, this.input.read());
      if (this.track.clampToBounds(this.car.position)) {
        this.car.dampSpeed(COLLISION_DAMP);
        this.car.root.position.copyFrom(this.car.position);
      }
      this.lapTiming.update(this.car.position);
      this.hud.update({
        lap: this.lapTiming.lapCount + 1,
        currentMs: this.lapTiming.currentLapMs,
        bestMs: this.lapTiming.bestLapMs,
      });
    });
  }

  render(): void {
    this.scene.render();
  }

  dispose(): void {
    this.hud.dispose();
    this.input.dispose();
    this.scene.dispose();
  }
}
