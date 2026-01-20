export class RationalScale {
  constructor(numerator, denominator) {
    if (denominator === 0n) {
      throw new Error('Scale denominator cannot be zero');
    }
    this._numer = BigInt(numerator);
    this._denom = BigInt(denominator);
  }

  get numerator() {
    return this._numer;
  }

  get denominator() {
    return this._denom;
  }

  timeToPx(timeDelta) {
    const result = (timeDelta * this._numer) / this._denom;
    return Number(result);
  }

  pxToTime(pxDelta) {
    const bigPx = BigInt(Math.round(pxDelta));
    return (bigPx * this._denom) / this._numer;
  }

  zoom(factor) {
    if (factor <= 0) {
      throw new Error('Zoom factor must be positive');
    }
    const factorBig = BigInt(Math.round(factor * 1000000));
    const newNumer = (this._numer * factorBig) / 1000000n;
    return new RationalScale(newNumer, this._denom);
  }

  static fromSecondsPerPixel(secondsPerPixel) {
    const scaledValue = BigInt(Math.round(secondsPerPixel * 1000000));
    return new RationalScale(1000000n, scaledValue);
  }

  static fromPixelsPerSecond(pixelsPerSecond) {
    const scaledValue = BigInt(Math.round(pixelsPerSecond * 1000000));
    return new RationalScale(scaledValue, 1000000n);
  }

  getSecondsPerPixel() {
    return Number(this._denom) / Number(this._numer);
  }

  getPixelsPerSecond() {
    return Number(this._numer) / Number(this._denom);
  }
}
