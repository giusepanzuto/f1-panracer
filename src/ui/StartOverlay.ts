export class StartOverlay {
  private readonly root: HTMLElement;

  constructor(onStart: () => void, onDesigner: () => void) {
    this.root = document.createElement('div');
    this.root.className = 'start-overlay';
    this.root.innerHTML = `
      <div class="start-title">F1 PANRACER</div>
      <div class="start-hint">Tocca o premi <kbd>SPAZIO</kbd> per partire</div>
      <button class="start-designer-btn" data-action="designer">DISEGNA UNA PISTA</button>
    `;
    document.body.appendChild(this.root);

    const designerBtn = this.root.querySelector<HTMLButtonElement>(
      '[data-action="designer"]',
    );
    designerBtn?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    designerBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      onDesigner();
    });

    this.root.addEventListener('pointerdown', (e) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest('[data-action="designer"]')
      ) {
        return;
      }
      e.preventDefault();
      onStart();
    });
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
