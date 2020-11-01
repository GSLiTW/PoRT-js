const Buffer = require('buffer').Buffer

module.exports = class BigInteger {
  constructor (value) {
    if (!Buffer.isBuffer(value)) throw new Error('Not a Buffer')
    this.buffer = value
    this._trim()
  }

  /**
   * Creates a big integer
   * @param {Array|ArrayBuffer|Buffer} value
   * @returns {BigInteger}
   */
  static from (value) {
    return new BigInteger(Buffer.from(value))
  }

  /**
   * Trims leading zeros
   * @private
   */
  _trim () {
    let i = 0
    while (this.buffer[i++] === 0);
    this.buffer = this.buffer.slice(i === this.buffer.length + 1 ? i - 2 : i - 1)
  }

  /**
   * Returns the length of the number (buffer length)
   * @returns {Number}
   */
  get length () {
    return this.buffer.length
  }

  /**
   * Returns the last index of the buffer (length -1)
   * @returns {Number}
   * @private
   */
  get _lastIndex () {
    return this.length - 1
  }

  /**
   * Checks if the BigInteger is zero
   * @returns {boolean}
   */
  isZero () {
    return this.length === 1 && this.buffer[0] === 0
  }

  /**
   * Checks if the BigInteger is one
   * @returns {boolean}
   */
  isOne () {
    return this.length === 1 && this.buffer[0] === 1
  }

  /**
   * Bitwise and operation
   * @param {BigInteger} bigInteger
   * @returns {BigInteger}
   */
  and (bigInteger) {
    let thisPos = this._lastIndex
    let bigIntegerPos = bigInteger._lastIndex
    const result = Buffer.alloc(Math.min(this.length, bigInteger.length))

    for (let i = result.length - 1; i >= 0; i--) result[i] = this.buffer[thisPos--] & bigInteger.buffer[bigIntegerPos--]
    return BigInteger.from(result)
  }

  /**
   * Bitwise or operation
   * @param {BigInteger} bigInteger
   * @returns {BigInteger}
   */
  or (bigInteger) {
    let thisPos = this._lastIndex
    let bigIntegerPos = bigInteger._lastIndex
    const result = Buffer.alloc(Math.max(this.length, bigInteger.length))

    for (let i = result.length - 1; i >= 0; i--) result[i] = this.buffer[thisPos--] | bigInteger.buffer[bigIntegerPos--]
    return BigInteger.from(result)
  }

  /**
   * Bitwise xor operation
   * @param {BigInteger} bigInteger
   * @returns {BigInteger}
   */
  xor (bigInteger) {
    let thisPos = this._lastIndex
    let bigIntegerPos = bigInteger._lastIndex
    const result = Buffer.alloc(Math.max(this.length, bigInteger.length))

    for (let i = result.length - 1; i >= 0; i--) result[i] = this.buffer[thisPos--] ^ bigInteger.buffer[bigIntegerPos--]
    return BigInteger.from(result)
  }

  /**
   * Bitwise not operation
   * @returns {BigInteger}
   */
  not () {
    const result = Buffer.alloc(this.length)

    for (let i = 0; i < result.length; i++) result[i] = ~this.buffer[i]
    return BigInteger.from(result)
  }

  /**
   * Addition
   * @param {BigInteger} bigInteger
   * @returns {BigInteger}
   */
  add (bigInteger) {
    let bigger = this
    let smaller = bigInteger
    if (this.compare(bigInteger) < 0) {
      bigger = bigInteger
      smaller = this
    }
    const result = Buffer.alloc(bigger.length + 1)

    let biggerPos = bigger._lastIndex
    let smallerPos = smaller._lastIndex
    let carry = 0

    while (smallerPos >= 0) {
      const currentResult = bigger.buffer[biggerPos--] + smaller.buffer[smallerPos--] + carry
      carry = (0xFF00 & currentResult) >> 8
      result[biggerPos + 2] = currentResult & 0xFF
    }
    while (biggerPos >= 0) result[biggerPos + 1] = bigger[biggerPos--]

    return BigInteger.from(result)
  }

  /**
   * Compares two BigInteger.
   * @param {BigInteger} target
   * @returns {Number} 0 if target is the same, 1 if target is greater and -1 if target is smaller than this.
   */
  compare (target) {
    return this.buffer.compare(target.buffer)
  }
}
