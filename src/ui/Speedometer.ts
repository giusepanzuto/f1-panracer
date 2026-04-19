export class Speedometer {
  private readonly root: HTMLElement;
  private readonly valueEl: HTMLElement;

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'speedometer';
    this.root.innerHTML = `
      <div class="speedometer-value" data-slot="value">0</div>
      <div class="speedometer-unit">KM/H</div>
    `;
    document.body.appendChild(this.root);

    const value = this.root.querySelector<HTMLElement>('[data-slot="value"]');
    if (!value) throw new Error('Speedometer value non trovato');
    this.valueEl = value;
  }

  update(speedKmh: number): void {
    this.valueEl.textContent = String(Math.round(speedKmh));
  }

  dispose(): void {
    this.root.remove();
  }
}
