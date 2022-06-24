/* eslint-disable max-len */
/* From creator.js*/
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const hashVerify = crypto.createHash('sha256');
const BN = require('bn.js');


/**
 * Cosig class is responsible for do cosig algorithm calculation
 * @class
 * @param  {number} challenge - creator generate challenge
 * @param  {number} r0 - gather all response from voter and calculate final result
 */
function Cosig() {
  this.challenge = null;
  this.r0 = null;
}

/**
 *
 * @param {*} voterPubV - string of all voter PublicV
 * @param {Block} block - whole new Block
 * @return {string} - challenge(hex type)
 */
Cosig.prototype.generateChallenge = function(voterPubV, block) {
  this.v0Aggr = voterPubV[0];
  for (let i = 1; i < voterPubV.length; i++) {
    this.v0Aggr = this.v0Aggr.add(voterPubV[i]);
  }

  hash.update(this.v0Aggr.encode('hex') + block);
  this.challenge = new BN(hash.copy().digest('hex'), 'hex');
  // this.challenge = this.challenge.toString('hex');

  return this.challenge;
};

Cosig.prototype.aggregateResponse = function(voterResponse) {
  this.r0Aggr = voterResponse[0];
  for (let i = 1; i < voterResponse.length; i++) {
    this.r0Aggr = this.r0Aggr.add(voterResponse[i]);
  }
  this.r0 = this.r0Aggr;
  return this.r0Aggr;
};

Cosig.prototype.verifyCosig = function(gr0, x0c, challenge, Block) {
  const newpubV = gr0.add(x0c);
  hashVerify.update(newpubV.encode('hex') + Block);
  const newchallenge = new BN(hashVerify.copy().digest(), 'hex');
  const result = newchallenge.eq(challenge);
  return result;
};

Cosig.prototype.computePubkeyMulWithChallenge = function(voterPubKey, challenge) {
  let x0 = voterPubKey[0];
  for (let i = 1; i < voterPubKey.length; i++) {
    x0 = x0.add(voterPubKey[i]);
  }
  x0 = x0.mul(challenge);
  return x0;
};

module.exports = Cosig;
