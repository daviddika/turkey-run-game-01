// Turkey Trot — input.js
// Keyboard + mouse + touch input in one place. The game loop reads a plain
// state object each frame (held keys, pressed-this-frame edges, pointer
// position), so gameplay code never touches DOM events directly.
// Keys: Arrows/WASD move & jump, Space jump, Shift/X dash, C decoy,
// P pause, M mute, R restart, Enter/Space confirm on menus.

export class TurkeyInput {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set(); // edge-triggered: cleared each frame by consumePressed()
    this.pointerX = 0;
    this.pointerY = 0;
    this.pointerDown = false;
    this.pointerClicked = false; // edge: a click/tap this frame
    this.pointerHeld = false;
    this.anyKeyPressed = false;
    this.attach();
  }

  attach() {
    window.addEventListener('keydown', (event) => {
      const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
      if (gameKeys.includes(event.code)) event.preventDefault();
      if (!event.repeat) {
        this.pressed.add(event.code);
        this.anyKeyPressed = true;
      }
      this.keys.add(event.code);
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.pointerDown = false;
      this.pointerHeld = false;
    });

    const updatePointer = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointerX = ((event.clientX - rect.left) / rect.width) * 1280;
      this.pointerY = ((event.clientY - rect.top) / rect.height) * 720;
    };
    this.canvas.addEventListener('pointermove', updatePointer);
    this.canvas.addEventListener('pointerdown', (event) => {
      updatePointer(event);
      this.pointerDown = true;
      this.pointerHeld = true;
      this.pointerClicked = true;
      this.pressed.add('PointerDown');
      this.anyKeyPressed = true;
    });
    this.canvas.addEventListener('pointerup', () => {
      this.pointerDown = false;
      this.pointerHeld = false;
    });
    this.canvas.addEventListener('pointercancel', () => {
      this.pointerDown = false;
      this.pointerHeld = false;
    });
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  isDown(code) {
    return this.keys.has(code);
  }

  /** True only on the frame the key went down. */
  wasPressed(code) {
    return this.pressed.has(code);
  }

  get moveLeft() {
    return this.isDown('ArrowLeft') || this.isDown('KeyA');
  }

  get moveRight() {
    return this.isDown('ArrowRight') || this.isDown('KeyD');
  }

  get moveUp() {
    return this.isDown('ArrowUp') || this.isDown('KeyW');
  }

  get moveDown() {
    return this.isDown('ArrowDown') || this.isDown('KeyS');
  }

  get jumpPressed() {
    return this.wasPressed('Space') || this.wasPressed('ArrowUp') || this.wasPressed('KeyW');
  }

  get dashHeld() {
    return this.isDown('ShiftLeft') || this.isDown('ShiftRight') || this.isDown('KeyX');
  }

  get dashPressed() {
    return this.wasPressed('ShiftLeft') || this.wasPressed('ShiftRight') || this.wasPressed('KeyX');
  }

  get decoyPressed() {
    return this.wasPressed('KeyC');
  }

  get pausePressed() {
    return this.wasPressed('KeyP') || this.wasPressed('Escape');
  }

  get restartPressed() {
    return this.wasPressed('KeyR');
  }

  get mutePressed() {
    return this.wasPressed('KeyM');
  }

  get confirmPressed() {
    return this.wasPressed('Enter') || this.wasPressed('Space') || this.pointerClicked;
  }

  /** Call at the end of each frame so edges fire exactly once. */
  endFrame() {
    this.pressed.clear();
    this.pointerClicked = false;
    this.anyKeyPressed = false;
  }
}
