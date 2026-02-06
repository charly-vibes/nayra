const MAX_POINTERS = 2;

export class GestureRecognizer {
  constructor() {
    this._pointers = new Map();
  }

  get pointerCount() {
    return this._pointers.size;
  }

  addPointer(pointerId, x, y, timestamp) {
    if (this._pointers.size >= MAX_POINTERS) {
      return;
    }
    this._pointers.set(pointerId, {
      x,
      y,
      timestamp,
      initialX: x,
      initialY: y,
    });
  }

  updatePointer(pointerId, x, y, timestamp) {
    const pointer = this._pointers.get(pointerId);
    if (pointer) {
      pointer.x = x;
      pointer.y = y;
      pointer.timestamp = timestamp;
    }
  }

  removePointer(pointerId) {
    this._pointers.delete(pointerId);
  }

  getPointer(pointerId) {
    return this._pointers.get(pointerId);
  }

  clear() {
    this._pointers.clear();
  }
}
