import type { Vector3 } from '@babylonjs/core';

const SIZE = 160;
const PADDING = 12;

export class Minimap {
  private readonly root: HTMLElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly centerline: ReadonlyArray<Vector3>;
  private readonly bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  private readonly scale: number;
  private readonly offsetX: number;
  private readonly offsetY: number;

  constructor(centerline: ReadonlyArray<Vector3>) {
    this.centerline = centerline;

    this.root = document.createElement('div');
    this.root.className = 'minimap';
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    canvas.className = 'minimap-canvas';
    this.root.appendChild(canvas);
    document.body.appendChild(this.root);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Minimap: 2D context non disponibile');
    this.ctx = ctx;

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const p of centerline) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }
    this.bounds = { minX, maxX, minZ, maxZ };

    const innerW = SIZE - 2 * PADDING;
    const innerH = SIZE - 2 * PADDING;
    const scaleX = innerW / (maxX - minX);
    const scaleZ = innerH / (maxZ - minZ);
    this.scale = Math.min(scaleX, scaleZ);
    this.offsetX = PADDING + (innerW - (maxX - minX) * this.scale) / 2;
    this.offsetY = PADDING + (innerH - (maxZ - minZ) * this.scale) / 2;
  }

  update(pos: Vector3, heading: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, SIZE, SIZE);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < this.centerline.length; i++) {
      const p = this.centerline[i];
      const { cx, cy } = this.worldToCanvas(p.x, p.z);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.closePath();
    ctx.stroke();

    const startP = this.centerline[0];
    const { cx: sx, cy: sy } = this.worldToCanvas(startP.x, startP.z);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx - 3, sy - 3, 6, 6);

    const { cx, cy } = this.worldToCanvas(pos.x, pos.z);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.atan2(-Math.cos(heading), Math.sin(heading)));
    ctx.fillStyle = '#e62030';
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-4, -4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  dispose(): void {
    this.root.remove();
  }

  private worldToCanvas(x: number, z: number): { cx: number; cy: number } {
    return {
      cx: this.offsetX + (x - this.bounds.minX) * this.scale,
      cy: this.offsetY + (this.bounds.maxZ - z) * this.scale,
    };
  }
}
