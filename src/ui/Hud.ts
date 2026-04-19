type HudState = {
  lap: number;
  currentMs: number;
  bestMs: number | null;
};

export class Hud {
  private readonly root: HTMLElement;
  private readonly lapEl: HTMLElement;
  private readonly currentEl: HTMLElement;
  private readonly bestEl: HTMLElement;

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'hud';
    this.root.innerHTML = `
      <div class="hud-row"><span class="hud-label">GIRO</span><span class="hud-value" data-slot="lap">1</span></div>
      <div class="hud-row"><span class="hud-label">TEMPO</span><span class="hud-value" data-slot="current">0.000</span></div>
      <div class="hud-row"><span class="hud-label">BEST</span><span class="hud-value" data-slot="best">--.---</span></div>
    `;
    document.body.appendChild(this.root);

    this.lapEl = this.slot('lap');
    this.currentEl = this.slot('current');
    this.bestEl = this.slot('best');
  }

  update(state: HudState): void {
    this.lapEl.textContent = String(state.lap);
    this.currentEl.textContent = formatSeconds(state.currentMs);
    this.bestEl.textContent =
      state.bestMs === null ? '--.---' : formatSeconds(state.bestMs);
  }

  dispose(): void {
    this.root.remove();
  }

  private slot(name: string): HTMLElement {
    const el = this.root.querySelector<HTMLElement>(`[data-slot="${name}"]`);
    if (!el) throw new Error(`HUD slot "${name}" non trovato`);
    return el;
  }
}

function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(3);
}
