import {
  ArcRotateCamera,
  Engine,
  HemisphericLight,
  Scene,
  Vector3,
} from '@babylonjs/core';

export class Game {
  private readonly engine: Engine;
  private readonly scene: Scene;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { stencil: true });
    this.scene = new Scene(this.engine);
    this.scene.clearColor.set(0.05, 0.07, 0.12, 1);

    const camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 3,
      12,
      Vector3.Zero(),
      this.scene,
    );
    camera.attachControl(canvas, true);

    new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);

    window.addEventListener('resize', () => this.engine.resize());
  }

  start(): void {
    this.engine.runRenderLoop(() => this.scene.render());
  }
}
