# biginteger-buffer [WIP]

[![Build Status](https://travis-ci.org/piu130/biginteger-buffer.svg?branch=master)](https://travis-ci.org/piu130/biginteger-buffer)
[![codecov](https://codecov.io/gh/piu130/biginteger-buffer/branch/master/graph/badge.svg)](https://codecov.io/gh/piu130/biginteger-buffer)
[![dependencies Status](https://david-dm.org/piu130/biginteger-buffer/status.svg)](https://david-dm.org/piu130/biginteger-buffer)
[![devDependencies Status](https://david-dm.org/piu130/biginteger-buffer/dev-status.svg)](https://david-dm.org/piu130/biginteger-buffer?type=dev)
[![js-standard-style](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](http://standardjs.com/)

Simple calculation with Buffer/Array/ArrayBuffer.

## Installation

Install with npm:

```js
npm install --save biginteger-buffer
```

Then include it:

```js
const BigInteger = require('biginteger-buffer')
```

## Usage

Every function returns a new BigInteger object.

### Class methods

#### BigInteger.from(array|arrayBuffer|buffer)

Create a big integer with this function.

Examples:

```js
const zero = BigInteger.from([0x00])
const number = BigInteger.from(Buffer.from([0xFF, 0xAB, 0x01]))
```

### Instance variables

#### buffer

You can access the buffer with `number.buffer`

#### length

You can access the length of the number/buffer with `number.length`.

### Arithmetic operations

#### add(bigInteger)

Performs addition

### Comparison

#### compare(target)

Compares two big integers. Returns 0 if target is the same, 1 if target is greater and -1 if target is smaller than `this`.

#### isZero()

Checks if the number is zero.

#### isOne()

Checks if the number is one.

### Bitwise operations

#### and(bigInteger)

AND operation.

#### not()

NOT operation

#### or(bigInteger)

OR operation

#### xor(bigInteger)

XOR operation
