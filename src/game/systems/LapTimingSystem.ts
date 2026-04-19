import type { Vector3 } from '@babylonjs/core';
import { TRACK_CURVE_RADIUS, TRACK_STRAIGHT } from '../config/tuning';

const FINISH_X = -TRACK_STRAIGHT / 2;
const CHECKPOINT_Z = -(TRACK_CURVE_RADIUS - 5);

export class LapTimingSystem {
  lapCount = 0;
  lastLapMs: number | null = null;
  bestLapMs: number | null = null;

  private lapStartMs: number;
  private prevX: number;
  private hasCheckpoint = false;

  constructor(startX: number) {
    this.prevX = startX;
    this.lapStartMs = performance.now();
  }

  get currentLapMs(): number {
    return performance.now() - this.lapStartMs;
  }

  resetRun(startX: number): void {
    this.prevX = startX;
    this.lapStartMs = performance.now();
    this.hasCheckpoint = false;
    this.lapCount = 0;
    this.lastLapMs = null;
  }

  update(pos: Vector3): void {
    if (pos.z < CHECKPOINT_Z) this.hasCheckpoint = true;

    const crossedFinish =
      this.prevX < FINISH_X && pos.x >= FINISH_X && pos.z > 0;
    if (crossedFinish && this.hasCheckpoint) {
      this.completeLap();
    }
    this.prevX = pos.x;
  }

  private completeLap(): void {
    const now = performance.now();
    const lapMs = now - this.lapStartMs;
    this.lastLapMs = lapMs;
    if (this.bestLapMs === null || lapMs < this.bestLapMs) {
      this.bestLapMs = lapMs;
    }
    this.lapCount++;
    this.lapStartMs = now;
    this.hasCheckpoint = false;
  }
}
