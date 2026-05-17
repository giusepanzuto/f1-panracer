import {
  Color3,
  Engine,
  FollowCamera,
  HemisphericLight,
  Scene,
  Vector3,
} from '@babylonjs/core';
import { Billboards } from '../entities/Billboards';
import { Car } from '../entities/Car';
import { Fans } from '../entities/Fans';
import { Grandstand } from '../entities/Grandstand';
import { Scenery } from '../entities/Scenery';
import { Track } from '../entities/Track';
import { InputSystem } from '../systems/InputSystem';
import { LapTimingSystem } from '../systems/LapTimingSystem';
import { COLLISION_DAMP } from '../config/tuning';
import { Hud } from '../../ui/Hud';
import { Minimap } from '../../ui/Minimap';
import { Speedometer } from '../../ui/Speedometer';
import { StartOverlay } from '../../ui/StartOverlay';
import { TouchControls } from '../../ui/TouchControls';
import { TrackDesigner } from '../../ui/TrackDesigner';

type GameState = 'idle' | 'racing';

export class RaceScene {
  readonly scene: Scene;
  private readonly car: Car;
  private readonly input: InputSystem;
  private readonly hud: Hud;
  private readonly speedometer: Speedometer;
  private readonly startOverlay: StartOverlay;
  private readonly touchControls: TouchControls;
  private readonly designer: TrackDesigner;
  private track: Track;
  private scenery: Scenery;
  private grandstand: Grandstand;
  private billboards: Billboards;
  private fans: Fans;
  private lapTiming: LapTimingSystem;
  private minimap: Minimap;
  private state: GameState = 'idle';

  constructor(engine: Engine) {
    this.scene = new Scene(engine);
    this.scene.clearColor.set(0.45, 0.74, 0.96, 1);

    const light = new HemisphericLight(
      'light',
      new Vector3(0, 1, 0),
      this.scene,
    );
    light.diffuse = new Color3(1, 0.97, 0.9);
    light.groundColor = new Color3(0.45, 0.5, 0.45);
    light.intensity = 1;

    this.track = new Track(this.scene);
    this.scenery = new Scenery(this.scene, this.track.centerline);
    this.grandstand = new Grandstand(
      this.scene,
      this.track.startPosition,
      this.track.startHeading,
      -1,
    );
    this.billboards = new Billboards(this.scene, this.track.centerline);
    this.fans = new Fans(this.scene, this.track.centerline);
    this.car = new Car(this.scene);
    this.car.reset(this.track.startPosition, this.track.startHeading);
    this.input = new InputSystem();
    this.lapTiming = new LapTimingSystem(
      this.track.startPosition,
      this.track.finishLine,
      this.track.checkpointLine,
    );
    this.hud = new Hud();
    this.minimap = new Minimap(this.track.centerline);
    this.speedometer = new Speedometer();
    this.designer = new TrackDesigner();
    this.startOverlay = new StartOverlay(
      () => this.input.virtualPress('Space'),
      () => void this.openDesigner(),
    );
    this.touchControls = new TouchControls(this.input);

    const camera = new FollowCamera(
      'camera',
      new Vector3(0, 5, -8),
      this.scene,
      this.car.root,
    );
    camera.radius = 6;
    camera.heightOffset = 2;
    camera.rotationOffset = 180;
    camera.cameraAcceleration = 0.1;
    camera.maxCameraSpeed = 30;
    camera.fov = 1.2;

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
      this.speedometer.update(
        this.state === 'racing' ? this.car.speedKmh : 0,
      );
      this.minimap.update(this.car.position, this.car.heading);
    });
  }

  render(): void {
    this.scene.render();
  }

  dispose(): void {
    this.designer.dispose();
    this.touchControls.dispose();
    this.startOverlay.dispose();
    this.speedometer.dispose();
    this.minimap.dispose();
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
    this.lapTiming.resetRun(this.track.startPosition);
  }

  private async openDesigner(): Promise<void> {
    const centerline = await this.designer.open();
    if (centerline) {
      this.rebuildTrack(centerline);
    }
  }

  private rebuildTrack(centerline: Vector3[]): void {
    this.track.dispose();
    this.scenery.dispose();
    this.grandstand.dispose();
    this.billboards.dispose();
    this.fans.dispose();
    this.minimap.dispose();

    this.track = new Track(this.scene, centerline);
    this.scenery = new Scenery(this.scene, this.track.centerline);
    this.grandstand = new Grandstand(
      this.scene,
      this.track.startPosition,
      this.track.startHeading,
      -1,
    );
    this.billboards = new Billboards(this.scene, this.track.centerline);
    this.fans = new Fans(this.scene, this.track.centerline);
    this.lapTiming = new LapTimingSystem(
      this.track.startPosition,
      this.track.finishLine,
      this.track.checkpointLine,
    );
    this.minimap = new Minimap(this.track.centerline);
    this.car.reset(this.track.startPosition, this.track.startHeading);
  }
}
