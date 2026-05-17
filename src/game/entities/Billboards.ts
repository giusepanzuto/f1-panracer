import {
  Color3,
  DynamicTexture,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
} from '@babylonjs/core';
import type { Mesh } from '@babylonjs/core';
import { TRACK_WIDTH } from '../config/tuning';

type Sponsor = { name: string; bg: string; fg: string };

// Sponsor finti, coerenti con la livery PANRACER/TURBO della macchina
const SPONSORS: Sponsor[] = [
  { name: 'PANRACER', bg: '#e8e8e8', fg: '#1a1a1a' },
  { name: 'TURBO', bg: '#1a1a1a', fg: '#ffd92d' },
  { name: 'NOVA TYRES', bg: '#0f3a8a', fg: '#ffffff' },
  { name: 'APEX FUEL', bg: '#d62828', fg: '#ffffff' },
  { name: 'BLITZ', bg: '#ffd60a', fg: '#1a1a1a' },
  { name: 'DRAFT', bg: '#10b981', fg: '#ffffff' },
  { name: 'ZENITH', bg: '#7c3aed', fg: '#ffffff' },
  { name: 'MACH-1', bg: '#ffffff', fg: '#d62828' },
  { name: 'CARBONIQ', bg: '#1f2937', fg: '#22d3ee' },
  { name: 'GRIP+', bg: '#ff6b35', fg: '#1a1a1a' },
];

const TARGET_SPACING = 35;
const MIN_COUNT = 6;
const MAX_COUNT = 20;
const START_BUFFER = 30;

const BILLBOARD_W = 6;
const BILLBOARD_H = 1.7;
const POST_H = 1.4;
const POST_W = 0.18;
const PANEL_DEPTH = 0.12;
const OFFSET_FROM_WALL = 4;

export class Billboards {
  private readonly meshes: Mesh[] = [];
  private readonly disposables: (DynamicTexture | StandardMaterial)[] = [];

  constructor(scene: Scene, centerline: Vector3[]) {
    const halfWidth = TRACK_WIDTH / 2;
    const offset = halfWidth + OFFSET_FROM_WALL;

    const totalLen = pathLength(centerline);
    const count = Math.max(
      MIN_COUNT,
      Math.min(MAX_COUNT, Math.round(totalLen / TARGET_SPACING)),
    );

    // Lascia spazio attorno alla partenza per non sovrapporsi alla tribuna
    const usable = Math.max(totalLen * 0.4, totalLen - 2 * START_BUFFER);
    const start = (totalLen - usable) / 2;
    const stride = count > 1 ? usable / (count - 1) : 0;

    const postMat = new StandardMaterial('billboard-post-mat', scene);
    postMat.diffuseColor = new Color3(0.2, 0.2, 0.22);
    postMat.specularColor = Color3.Black();
    this.disposables.push(postMat);

    for (let i = 0; i < count; i++) {
      const arc = start + i * stride;
      const sample = sampleAt(centerline, arc);
      const heading = Math.atan2(sample.tx, sample.tz);
      // esterno: sinistra del tangente (il loop è CW dopo normalizeOrientation)
      const px = -Math.cos(heading);
      const pz = Math.sin(heading);
      const cx = sample.x + px * offset;
      const cz = sample.z + pz * offset;
      const sponsor = SPONSORS[i % SPONSORS.length];
      this.buildBillboard(scene, cx, cz, heading, sponsor, postMat);
    }
  }

  private buildBillboard(
    scene: Scene,
    cx: number,
    cz: number,
    heading: number,
    sponsor: Sponsor,
    postMat: StandardMaterial,
  ): void {
    const tex = makeBillboardTexture(scene, sponsor);
    this.disposables.push(tex);

    const panelMat = new StandardMaterial(
      `billboard-mat-${sponsor.name}`,
      scene,
    );
    panelMat.diffuseTexture = tex;
    panelMat.specularColor = Color3.Black();
    panelMat.emissiveColor = new Color3(0.18, 0.18, 0.18);
    this.disposables.push(panelMat);

    const tx = Math.sin(heading);
    const tz = Math.cos(heading);

    for (const sign of [-1, 1] as const) {
      const offsetAlong = BILLBOARD_W * 0.42 * sign;
      const post = MeshBuilder.CreateBox(
        'billboard-post',
        { width: POST_W, height: POST_H, depth: POST_W },
        scene,
      );
      post.position.set(
        cx + tx * offsetAlong,
        POST_H / 2,
        cz + tz * offsetAlong,
      );
      post.material = postMat;
      this.meshes.push(post);
    }

    const panel = MeshBuilder.CreateBox(
      'billboard-panel',
      { width: BILLBOARD_W, height: BILLBOARD_H, depth: PANEL_DEPTH },
      scene,
    );
    panel.position.set(cx, POST_H + BILLBOARD_H / 2, cz);
    // +π/2 invece di -π/2: la faccia +Z (testurata in lettura "normale")
    // punta verso la pista, non verso fuori
    panel.rotation.y = heading + Math.PI / 2;
    panel.material = panelMat;
    this.meshes.push(panel);
  }

  dispose(): void {
    for (const m of this.meshes) m.dispose();
    for (const d of this.disposables) d.dispose();
    this.meshes.length = 0;
    this.disposables.length = 0;
  }
}

function makeBillboardTexture(
  scene: Scene,
  sponsor: Sponsor,
): DynamicTexture {
  const W = 1024;
  const H = 256;
  const tex = new DynamicTexture(
    `billboard-tex-${sponsor.name}`,
    { width: W, height: H },
    scene,
    false,
  );
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;

  ctx.fillStyle = sponsor.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = sponsor.fg;
  ctx.fillRect(0, 14, W, 8);
  ctx.fillRect(0, H - 22, W, 8);

  // Pastiglia con iniziale a sinistra
  ctx.fillStyle = sponsor.fg;
  ctx.beginPath();
  ctx.arc(110, H / 2, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = sponsor.bg;
  ctx.font = 'bold 76px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sponsor.name.charAt(0), 110, H / 2 + 4);

  // Nome sponsor
  ctx.fillStyle = sponsor.fg;
  ctx.font = `900 ${Math.floor(H * 0.42)}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(sponsor.name, 200, H / 2 + 4);

  tex.update();
  tex.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
  // Le UV della faccia +Z del box, viste dal lato pista, hanno sia U sia V
  // invertite rispetto al canvas: equivale a ruotare la texture di 180°
  tex.uScale = -1;
  tex.uOffset = 1;
  tex.vScale = -1;
  tex.vOffset = 1;
  return tex;
}

function pathLength(path: Vector3[]): number {
  let total = 0;
  const n = path.length;
  for (let i = 0; i < n; i++) {
    const a = path[i];
    const b = path[(i + 1) % n];
    total += Math.hypot(b.x - a.x, b.z - a.z);
  }
  return total;
}

function sampleAt(
  path: Vector3[],
  targetArc: number,
): { x: number; z: number; tx: number; tz: number } {
  const n = path.length;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const a = path[i];
    const b = path[(i + 1) % n];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    if (acc + len >= targetArc) {
      const t = (targetArc - acc) / len;
      const invLen = 1 / len;
      return {
        x: a.x + dx * t,
        z: a.z + dz * t,
        tx: dx * invLen,
        tz: dz * invLen,
      };
    }
    acc += len;
  }
  const a = path[n - 1];
  const b = path[0];
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  return { x: a.x, z: a.z, tx: dx / len, tz: dz / len };
}
