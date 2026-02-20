const MAX_POINTERS = 2;

export class GestureRecognizer {
  constructor() {
    this._pointers = new Map();
    this._pinchInitialDistance = null;
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

    if (this._pointers.size === 2) {
      const pinch = this.getPinchState();
      if (pinch && pinch.distance > 0) {
        this._pinchInitialDistance = pinch.distance;
      } else {
        this._pinchInitialDistance = null;
      }
    }

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
    if (this._pointers.size < 2) {
      this._pinchInitialDistance = null;
    }
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
    this._pinchInitialDistance = null;
  }

  reset() {
    this._pointers.clear();
    this._pinchInitialDistance = null;
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

  getPinchZoom() {
    if (this._pointers.size < 2) return null;
    if (this._pinchInitialDistance === null || this._pinchInitialDistance === 0) return null;

    const current = this.getPinchState();
    if (!current || current.distance === 0) return null;

    return {
      factor: current.distance / this._pinchInitialDistance,
      midpointX: current.midpointX,
      midpointY: current.midpointY,
    };
  }
}
