export type InputAxes = {
  throttle: number;
  steer: number;
};

export class InputSystem {
  private readonly pressed = new Set<string>();

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    this.pressed.add(e.code);
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.pressed.delete(e.code);
  };

  read(): InputAxes {
    const up = this.pressed.has('ArrowUp') || this.pressed.has('KeyW');
    const down = this.pressed.has('ArrowDown') || this.pressed.has('KeyS');
    const left = this.pressed.has('ArrowLeft') || this.pressed.has('KeyA');
    const right = this.pressed.has('ArrowRight') || this.pressed.has('KeyD');
    return {
      throttle: (up ? 1 : 0) - (down ? 1 : 0),
      steer: (right ? 1 : 0) - (left ? 1 : 0),
    };
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
