/* From creator.js*/
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const hashVerify = crypto.createHash('sha256');
const BN = require('bn.js');

/**
 * Cosig class is a library which is responsible for doing cosig algorithm calculation
 * @class
 * @param  {number} challenge - creator generate challenge
 * @param  {number} r0 - gather all response from voter and calculate final result
 */
function Cosig() {
  this.challenge = null;
  this.r0 = null;
}

/**
 * Creator generate challenge in normal state
 * @param {Array} voterPubV - string of all voter PublicV
 * @param {Block} block - whole new Block
 * @return {string} - hex string of challenge
 */
Cosig.prototype.generateChallenge = function(voterPubV, block) {
  this.v0Aggr = voterPubV[0];
  for (let i = 1; i < voterPubV.length; i++) {
    this.v0Aggr = this.v0Aggr.add(voterPubV[i]);
  }

  hash.update(this.v0Aggr.encode('hex') + block);
  this.challenge = new BN(hash.copy().digest('hex'), 'hex');

  return this.challenge;
};

/**
 * Creator generate challenge in the state of any voter has disconnected
 * @param {Array} voterPubV - string of all voter PublicV
 * @param {Block} block - whole new Block
 * @param {Array} voterIndex - index of voter who has attended
 * @returns {string} - hex string of challenge
 */

Cosig.prototype.generateChallengeWithIndex = function(voterPubV, block, voterIndex) {
  this.v0Aggr = voterPubV[voterIndex[0]];
  for (let i = 1; i < voterIndex.length; i++) {
    this.v0Aggr = this.v0Aggr.add(voterPubV[voterIndex[i]]);
  }

  hash.update(this.v0Aggr.encode('hex') + block);
  this.challenge = new BN(hash.copy().digest('hex'), 'hex');

  return this.challenge;
};

/**
 * Creator generate response
 * @param {Array} voterResponse - response from voters
 * @returns {string} - response
 */
Cosig.prototype.aggregateResponse = function(voterResponse) {
  this.r0Aggr = voterResponse[0];
  for (let i = 1; i < voterResponse.length; i++) {
    this.r0Aggr = this.r0Aggr.add(voterResponse[i]);
  }
  this.r0 = this.r0Aggr;
  return this.r0Aggr;
};

/**
 * Verify cosig by comparing challenges computed in two different methods
 * @param {string} gr0 - publick key generated with ECDSA by utilizing r0Aggr as private key
 * @param {string} x0c - compute with voter's public keys and challenge
 * @param {string} challenge - hex string of challenge
 * @param {Block} block - whole new Block
 * @returns {boolean}
 */
Cosig.prototype.verifyCosig = function(gr0, x0c, challenge, block) {
  const newpubV = gr0.add(x0c);
  hashVerify.update(newpubV.encode('hex') + block);
  const newchallenge = new BN(hashVerify.copy().digest(), 'hex');
  const result = newchallenge.eq(challenge);
  return result;
};
/**
 * Compute x0 with voter's public keys and challenge
 * @param {Array} voterPubKey - hex string of all voter's public keys
 * @param {string} challenge - hex string of challenge
 * @returns {string}
 */
Cosig.prototype.computePubkeyMulWithChallenge = function(voterPubKey, challenge) {
  let x0 = voterPubKey[0];
  for (let i = 1; i < voterPubKey.length; i++) {
    x0 = x0.add(voterPubKey[i]);
  }
  x0 = x0.mul(challenge);
  return x0;
};
/**
 * Voter generate response
 * @param {string} cHex - hex string of challenge
 * @param {string} secretv - voter secretv
 * @param {string} privateKey - voter private key
 * @returns {string} - hex string of response
 */
Cosig.prototype.GenerateResponse = function(cHex, secretv, privateKey) {
  const c = new BN(cHex, 'hex');
  const v = new BN(secretv.toString('hex'), 'hex');
  const x = new BN(privateKey.toString('hex'), 'hex');
  this.response = v.sub(c.mul(x));

  return this.response.toString('hex');
};

module.exports = Cosig;
