import {
  ArcRotateCamera,
  Engine,
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

  constructor(engine: Engine, canvas: HTMLCanvasElement) {
    this.scene = new Scene(engine);
    this.scene.clearColor.set(0.05, 0.07, 0.12, 1);

    const camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 3,
      28,
      Vector3.Zero(),
      this.scene,
    );
    camera.attachControl(canvas, true);

    new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);

    new Track(this.scene);
    this.car = new Car(this.scene);
    this.input = new InputSystem();

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
