import { Vector3 } from '@babylonjs/core';

const TARGET_WORLD_SIZE = 280;
const MIN_POINT_SPACING = 6;
const MIN_POINTS = 20;

type CanvasPoint = { x: number; y: number };

export class TrackDesigner {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly hintEl: HTMLElement;
  private points: CanvasPoint[] = [];
  private drawing = false;
  private resolver: ((centerline: Vector3[] | null) => void) | null = null;
  private readonly onResize = (): void => this.layoutCanvas();

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'designer-overlay hidden';
    this.root.innerHTML = `
      <div class="designer-header">
        <div class="designer-title">DISEGNA LA TUA PISTA</div>
        <div class="designer-hint" data-slot="hint">Trascina col dito o col mouse per disegnare un anello chiuso</div>
      </div>
      <canvas class="designer-canvas" data-slot="canvas"></canvas>
      <div class="designer-footer">
        <button class="designer-btn secondary" data-action="clear">PULISCI</button>
        <button class="designer-btn secondary" data-action="cancel">ANNULLA</button>
        <button class="designer-btn primary" data-action="go">CORRI!</button>
      </div>
    `;
    document.body.appendChild(this.root);

    const canvas = this.root.querySelector<HTMLCanvasElement>('[data-slot="canvas"]');
    const hint = this.root.querySelector<HTMLElement>('[data-slot="hint"]');
    if (!canvas || !hint) throw new Error('TrackDesigner: elementi mancanti');
    this.canvas = canvas;
    this.hintEl = hint;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('TrackDesigner: 2D context non disponibile');
    this.ctx = ctx;

    this.bindPointer();
    this.bindButtons();
  }

  open(): Promise<Vector3[] | null> {
    return new Promise((resolve) => {
      this.resolver = resolve;
      this.points = [];
      this.root.classList.remove('hidden');
      window.addEventListener('resize', this.onResize);
      this.layoutCanvas();
      this.setHint('Trascina col dito o col mouse per disegnare un anello chiuso');
    });
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.root.remove();
  }

  private finish(result: Vector3[] | null): void {
    this.root.classList.add('hidden');
    window.removeEventListener('resize', this.onResize);
    const resolver = this.resolver;
    this.resolver = null;
    if (resolver) resolver(result);
  }

  private layoutCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.floor(rect.width);
    this.canvas.height = Math.floor(rect.height);
    this.redraw();
  }

  private bindPointer(): void {
    const onDown = (e: PointerEvent): void => {
      e.preventDefault();
      this.canvas.setPointerCapture(e.pointerId);
      this.drawing = true;
      this.points = [];
      const p = this.localPoint(e);
      this.points.push(p);
      this.redraw();
    };
    const onMove = (e: PointerEvent): void => {
      if (!this.drawing) return;
      const p = this.localPoint(e);
      const last = this.points[this.points.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < MIN_POINT_SPACING) return;
      this.points.push(p);
      this.redraw();
    };
    const onUp = (): void => {
      if (!this.drawing) return;
      this.drawing = false;
      this.redraw();
      if (this.points.length < MIN_POINTS) {
        this.setHint(
          'Pista troppo corta - prova a disegnarne una piu lunga',
          true,
        );
      } else {
        this.setHint(
          `Ottimo: ${this.points.length} punti. Premi CORRI! quando sei pronto`,
        );
      }
    };
    this.canvas.addEventListener('pointerdown', onDown);
    this.canvas.addEventListener('pointermove', onMove);
    this.canvas.addEventListener('pointerup', onUp);
    this.canvas.addEventListener('pointercancel', onUp);
  }

  private bindButtons(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'clear') {
          this.points = [];
          this.redraw();
          this.setHint('Trascina col dito o col mouse per disegnare un anello chiuso');
        } else if (action === 'cancel') {
          this.finish(null);
        } else if (action === 'go') {
          if (this.points.length < MIN_POINTS) {
            this.setHint('Pista troppo corta - disegnane una piu lunga', true);
            return;
          }
          const centerline = this.buildCenterline();
          this.finish(centerline);
        }
      });
    });
  }

  private localPoint(e: PointerEvent): CanvasPoint {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private setHint(text: string, isError = false): void {
    this.hintEl.textContent = text;
    this.hintEl.classList.toggle('error', isError);
  }

  private redraw(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (this.points.length === 0) return;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    if (!this.drawing && this.points.length >= MIN_POINTS) {
      ctx.lineTo(this.points[0].x, this.points[0].y);
    }
    ctx.stroke();

    const start = this.points[0];
    ctx.fillStyle = '#e62030';
    ctx.beginPath();
    ctx.arc(start.x, start.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  private buildCenterline(): Vector3[] {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of this.points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    const maxSpan = Math.max(spanX, spanY);
    const scale = TARGET_WORLD_SIZE / maxSpan;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    return this.points.map(
      (p) =>
        new Vector3(
          (p.x - cx) * scale,
          0,
          -(p.y - cy) * scale,
        ),
    );
  }
}
