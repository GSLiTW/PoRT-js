/* eslint-disable camelcase */
/* eslint-disable new-cap */
/* eslint-disable max-len */
/* From creator.js*/
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const BN = require('bn.js');
/* From voter.js*/
const elliptic = require('elliptic');
const schnorr = require('bip-schnorr');
const randomBytes = require('random-bytes');

/**
 * Cosig class is responsible for do cosig algorithm calculation
 * @class
 * @param  {String} challenge - creator generate challenge
 * @param  {number} r0 - gather all response from voter and calculate final result
 */
function Cosig() {
  this.challenge = null;
  this.r0 = null;
}

/**
 *
 * @param {*} VoterPubV - string of all voter PublicV
 * @param {Block} Block - whole new Block
 * @return {string} - challenge(hex type)
 */
Cosig.prototype.generateChallenge = function(VoterPubV, Block) {
  this.V0_aggr = VoterPubV[0];
  for (let i = 1; i < VoterPubV.length; i++) {
    this.V0_aggr = this.V0_aggr.add(VoterPubV[i]);
  }

  hash.update(this.V0_aggr.encode('hex') + Block);
  this.challenge = new BN(hash.copy().digest('hex'), 'hex');
  this.challenge = this.challenge.toString('hex');

  return this.challenge;
};

Cosig.prototype.AggregateResponse = function(VoterResponse) {
  this.r0_aggr = VoterResponse[0];
  for (let i = 1; i < VoterResponse.length; i++) {
    this.r0_aggr = this.r0_aggr.add(VoterResponse[i]);
  }
  this.r0 = this.r0_aggr;
  return this.r0_aggr;
};

Cosig.prototype.verifyCosig = function(G_r0, X0_c, challenge, Block) {
  const newpubV = G_r0.add(X0_c);
  const newchallenge = hash.update(newpubV.encode('hex') + Block);
  const result = newchallenge.eq(challenge);
  return result;
};

Cosig.prototype.compute_Pubkey_Mul_With_Challenge = function(VoterPubKey, challenge) {
  const X0 = VoterPubKey[0];
  for (let i = 1; i < VoterPubKey.length; i++) {
    X0.add(VoterPubKey[i]);
  }
  X0.mul(challenge);
}

module.exports = Cosig;
