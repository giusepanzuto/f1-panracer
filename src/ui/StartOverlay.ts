export class StartOverlay {
  private readonly root: HTMLElement;

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'start-overlay';
    this.root.innerHTML = `
      <div class="start-title">F1 PANRACER</div>
      <div class="start-hint">Premi <kbd>SPAZIO</kbd> per partire</div>
    `;
    document.body.appendChild(this.root);
  }

  show(): void {
    this.root.classList.remove('hidden');
  }

  hide(): void {
    this.root.classList.add('hidden');
  }

  dispose(): void {
    this.root.remove();
  }
}
