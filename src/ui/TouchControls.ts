import type { InputSystem } from '../game/systems/InputSystem';

export class TouchControls {
  private readonly input: InputSystem;
  private readonly root: HTMLElement;

  constructor(input: InputSystem) {
    this.input = input;
    this.root = document.createElement('div');
    this.root.className = 'touch-controls';
    this.root.innerHTML = `
      <div class="touch-steer">
        <button class="touch-btn" data-code="ArrowLeft" aria-label="sterzo sinistra">◀</button>
        <button class="touch-btn" data-code="ArrowRight" aria-label="sterzo destra">▶</button>
      </div>
      <div class="touch-pedals">
        <button class="touch-btn" data-code="ArrowDown" aria-label="freno">▼</button>
        <button class="touch-btn" data-code="ArrowUp" aria-label="accelera">▲</button>
      </div>
      <button class="touch-btn touch-reset" data-code="KeyR" aria-label="reset">R</button>
    `;
    document.body.appendChild(this.root);

    this.bindButtons();
  }

  dispose(): void {
    this.root.remove();
  }

  private bindButtons(): void {
    const buttons = this.root.querySelectorAll<HTMLButtonElement>('[data-code]');
    buttons.forEach((btn) => {
      const code = btn.dataset.code;
      if (!code) return;

      const press = (e: PointerEvent): void => {
        e.preventDefault();
        btn.setPointerCapture(e.pointerId);
        this.input.virtualPress(code);
        btn.classList.add('active');
      };
      const release = (): void => {
        this.input.virtualRelease(code);
        btn.classList.remove('active');
      };

      btn.addEventListener('pointerdown', press);
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
    });
  }
}
