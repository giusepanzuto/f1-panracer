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

export class RaceScene {
  readonly scene: Scene;
  private readonly car: Car;
  private readonly input: InputSystem;

  constructor(engine: Engine) {
    this.scene = new Scene(engine);
    this.scene.clearColor.set(0.05, 0.07, 0.12, 1);

    new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);

    const track = new Track(this.scene);
    this.car = new Car(this.scene);
    this.car.position.copyFrom(track.startPosition);
    this.car.heading = track.startHeading;
    this.input = new InputSystem();

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
    });
  }

  render(): void {
    this.scene.render();
  }

  dispose(): void {
    this.input.dispose();
    this.scene.dispose();
  }
}
