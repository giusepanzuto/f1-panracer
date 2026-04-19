import {
  Color3,
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
import { StartOverlay } from '../../ui/StartOverlay';

type GameState = 'idle' | 'racing';

export class RaceScene {
  readonly scene: Scene;
  private readonly car: Car;
  private readonly track: Track;
  private readonly input: InputSystem;
  private readonly lapTiming: LapTimingSystem;
  private readonly hud: Hud;
  private readonly startOverlay: StartOverlay;
  private state: GameState = 'idle';

  constructor(engine: Engine) {
    this.scene = new Scene(engine);
    this.scene.clearColor.set(0.52, 0.75, 0.92, 1);

    const light = new HemisphericLight(
      'light',
      new Vector3(0, 1, 0),
      this.scene,
    );
    light.diffuse = new Color3(1, 0.97, 0.9);
    light.groundColor = new Color3(0.45, 0.5, 0.45);
    light.intensity = 1;

    this.track = new Track(this.scene);
    this.car = new Car(this.scene);
    this.car.reset(this.track.startPosition, this.track.startHeading);
    this.input = new InputSystem();
    this.lapTiming = new LapTimingSystem(this.track.startPosition.x);
    this.hud = new Hud();
    this.startOverlay = new StartOverlay();

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

      if (this.state === 'idle') {
        if (this.input.consumePress('Space')) this.startRace();
      } else {
        if (this.input.consumePress('KeyR')) this.resetRun();
        this.car.update(dt, this.input.read());
        if (this.track.clampToBounds(this.car.position)) {
          this.car.dampSpeed(COLLISION_DAMP);
          this.car.root.position.copyFrom(this.car.position);
        }
        this.lapTiming.update(this.car.position);
      }

      this.hud.update({
        lap: this.lapTiming.lapCount + 1,
        currentMs: this.state === 'racing' ? this.lapTiming.currentLapMs : 0,
        bestMs: this.lapTiming.bestLapMs,
      });
    });
  }

  render(): void {
    this.scene.render();
  }

  dispose(): void {
    this.startOverlay.dispose();
    this.hud.dispose();
    this.input.dispose();
    this.scene.dispose();
  }

  private startRace(): void {
    this.resetRun();
    this.startOverlay.hide();
    this.state = 'racing';
  }

  private resetRun(): void {
    this.car.reset(this.track.startPosition, this.track.startHeading);
    this.lapTiming.resetRun(this.track.startPosition.x);
  }
}
