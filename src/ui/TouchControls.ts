import type { InputSystem } from '../game/systems/InputSystem';

const TILT_DEADZONE_DEG = 5;
const TILT_MAX_DEG = 25;

type OrientationPermission = {
  requestPermission?: () => Promise<PermissionState>;
};

export class TouchControls {
  private readonly input: InputSystem;
  private readonly root: HTMLElement;
  private tiltHandler: ((e: DeviceOrientationEvent) => void) | null = null;

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
      <button class="touch-btn touch-tilt" data-role="tilt" aria-label="attiva tilt">TILT</button>
    `;
    document.body.appendChild(this.root);

    this.bindButtons();
    this.bindTilt();
  }

  dispose(): void {
    if (this.tiltHandler) {
      window.removeEventListener('deviceorientation', this.tiltHandler);
      this.tiltHandler = null;
    }
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

  private bindTilt(): void {
    const btn = this.root.querySelector<HTMLButtonElement>('[data-role="tilt"]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      void this.toggleTilt(btn);
    });
  }

  private async toggleTilt(btn: HTMLButtonElement): Promise<void> {
    if (this.tiltHandler) {
      this.disableTilt(btn);
      return;
    }
    const permissionApi = DeviceOrientationEvent as unknown as OrientationPermission;
    if (typeof permissionApi.requestPermission === 'function') {
      try {
        const state = await permissionApi.requestPermission();
        if (state !== 'granted') return;
      } catch {
        return;
      }
    }
    this.enableTilt(btn);
  }

  private enableTilt(btn: HTMLButtonElement): void {
    btn.classList.add('active');
    this.tiltHandler = (e: DeviceOrientationEvent) => {
      this.input.setAnalogSteer(tiltToSteer(e));
    };
    window.addEventListener('deviceorientation', this.tiltHandler);
  }

  private disableTilt(btn: HTMLButtonElement): void {
    btn.classList.remove('active');
    if (this.tiltHandler) {
      window.removeEventListener('deviceorientation', this.tiltHandler);
      this.tiltHandler = null;
    }
    this.input.clearAnalogSteer();
  }
}

function tiltToSteer(e: DeviceOrientationEvent): number {
  const angle = screen.orientation?.angle ?? 0;
  let raw: number;
  if (angle === 90) {
    raw = e.beta ?? 0;
  } else if (angle === 270 || angle === -90) {
    raw = -(e.beta ?? 0);
  } else {
    raw = e.gamma ?? 0;
  }
  if (raw > TILT_DEADZONE_DEG) {
    return Math.min(1, (raw - TILT_DEADZONE_DEG) / (TILT_MAX_DEG - TILT_DEADZONE_DEG));
  }
  if (raw < -TILT_DEADZONE_DEG) {
    return Math.max(-1, (raw + TILT_DEADZONE_DEG) / (TILT_MAX_DEG - TILT_DEADZONE_DEG));
  }
  return 0;
}
