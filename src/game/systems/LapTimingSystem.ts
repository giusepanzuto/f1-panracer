import type { Vector3 } from '@babylonjs/core';
import type { Segment2D } from '../entities/Track';

export class LapTimingSystem {
  lapCount = 0;
  lastLapMs: number | null = null;
  bestLapMs: number | null = null;

  private readonly finishLine: Segment2D;
  private readonly checkpointLine: Segment2D;
  private lapStartMs: number;
  private prevFinishSide: number;
  private prevCheckpointSide: number;
  private hasCheckpoint = false;

  constructor(
    startPos: { x: number; z: number },
    finishLine: Segment2D,
    checkpointLine: Segment2D,
  ) {
    this.finishLine = finishLine;
    this.checkpointLine = checkpointLine;
    this.lapStartMs = performance.now();
    this.prevFinishSide = sideOf(startPos.x, startPos.z, finishLine);
    this.prevCheckpointSide = sideOf(startPos.x, startPos.z, checkpointLine);
  }

  get currentLapMs(): number {
    return performance.now() - this.lapStartMs;
  }

  resetRun(startPos: { x: number; z: number }): void {
    this.lapStartMs = performance.now();
    this.lapCount = 0;
    this.lastLapMs = null;
    this.hasCheckpoint = false;
    this.prevFinishSide = sideOf(startPos.x, startPos.z, this.finishLine);
    this.prevCheckpointSide = sideOf(startPos.x, startPos.z, this.checkpointLine);
  }

  update(pos: Vector3): void {
    const chkSide = sideOf(pos.x, pos.z, this.checkpointLine);
    if (
      this.prevCheckpointSide !== 0 &&
      Math.sign(chkSide) !== Math.sign(this.prevCheckpointSide)
    ) {
      this.hasCheckpoint = true;
    }
    this.prevCheckpointSide = chkSide;

    const finishSide = sideOf(pos.x, pos.z, this.finishLine);
    if (
      this.prevFinishSide < 0 &&
      finishSide >= 0 &&
      this.hasCheckpoint
    ) {
      this.completeLap();
    }
    this.prevFinishSide = finishSide;
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

function sideOf(x: number, z: number, seg: Segment2D): number {
  return (seg.bx - seg.ax) * (z - seg.az) - (seg.bz - seg.az) * (x - seg.ax);
}
