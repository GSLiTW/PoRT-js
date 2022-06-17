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
 * @param  {number} challenge - creator generate challenge
 * @param  {number} r0 - gather all response from voter and calculate final result
 */
function Cosig() {
  this.challenge = null;
  this.r0 = null;
}

/**
 *
 * @param {*} VoterPubV - string of all voter PublicV
 * @param {Block} Block - new Block
 * @return {string} - challenge(hex type)
 */
Cosig.prototype.generateChallenge = function(VoterPubV, Block) {
  this.V0_aggr = VoterPubV[0];
  for (let i = 1; i < VoterPubV.length; i++) {
    this.V0_aggr = this.V0_aggr.add(VoterPubV[i]);
  }

  hash.update(this.V0_aggr.encode('hex') + Block);
  this.challenge = new BN(hash.copy().digest('hex'), 'hex');

  return this.challenge.toString('hex');
};

module.exports = Cosig;
