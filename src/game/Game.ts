import { Engine } from '@babylonjs/core';
import { RaceScene } from './scenes/RaceScene';

export class Game {
  private readonly engine: Engine;
  private readonly race: RaceScene;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { stencil: true });
    this.race = new RaceScene(this.engine, canvas);

    window.addEventListener('resize', () => this.engine.resize());
  }

  start(): void {
    this.engine.runRenderLoop(() => this.race.render());
  }
}
