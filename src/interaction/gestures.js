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
      return false;
    }
    this._pointers.set(pointerId, {
      x,
      y,
      timestamp,
      initialX: x,
      initialY: y,
    });
    return true;
  }

  updatePointer(pointerId, x, y, timestamp) {
    const pointer = this._pointers.get(pointerId);
    if (pointer) {
      pointer.x = x;
      pointer.y = y;
      pointer.timestamp = timestamp;
      return true;
    }
    return false;
  }

  removePointer(pointerId) {
    this._pointers.delete(pointerId);
  }

  hasPointer(pointerId) {
    return this._pointers.has(pointerId);
  }

  getPointer(pointerId) {
    return this._pointers.get(pointerId);
  }

  getAnyPointer() {
    const iterator = this._pointers.values();
    const result = iterator.next();
    return result.done ? null : result.value;
  }

  clear() {
    this._pointers.clear();
  }

  reset() {
    this._pointers.clear();
  }

  getPinchState() {
    if (this._pointers.size < 2) return null;
    const [a, b] = [...this._pointers.values()];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return {
      distance: Math.sqrt(dx * dx + dy * dy),
      midpointX: (a.x + b.x) / 2,
      midpointY: (a.y + b.y) / 2,
    };
  }
}
