export type InputAxes = {
  throttle: number;
  steer: number;
};

export class InputSystem {
  private readonly pressed = new Set<string>();
  private readonly justPressed = new Set<string>();
  private analogSteer = 0;
  private analogSteerActive = false;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (!this.pressed.has(e.code)) {
      this.justPressed.add(e.code);
    }
    this.pressed.add(e.code);
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.pressed.delete(e.code);
  };

  consumePress(code: string): boolean {
    if (this.justPressed.has(code)) {
      this.justPressed.delete(code);
      return true;
    }
    return false;
  }

  virtualPress(code: string): void {
    if (!this.pressed.has(code)) {
      this.justPressed.add(code);
    }
    this.pressed.add(code);
  }

  virtualRelease(code: string): void {
    this.pressed.delete(code);
  }

  read(): InputAxes {
    const up = this.pressed.has('ArrowUp') || this.pressed.has('KeyW');
    const down = this.pressed.has('ArrowDown') || this.pressed.has('KeyS');
    const left = this.pressed.has('ArrowLeft') || this.pressed.has('KeyA');
    const right = this.pressed.has('ArrowRight') || this.pressed.has('KeyD');
    const digitalSteer = (right ? 1 : 0) - (left ? 1 : 0);
    const steer = this.analogSteerActive
      ? Math.max(-1, Math.min(1, digitalSteer + this.analogSteer))
      : digitalSteer;
    return {
      throttle: (up ? 1 : 0) - (down ? 1 : 0),
      steer,
    };
  }

  setAnalogSteer(value: number): void {
    this.analogSteer = Math.max(-1, Math.min(1, value));
    this.analogSteerActive = true;
  }

  clearAnalogSteer(): void {
    this.analogSteer = 0;
    this.analogSteerActive = false;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
