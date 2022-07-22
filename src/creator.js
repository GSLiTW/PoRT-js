/* eslint-disable max-len */
const Block = require('./block.js');
const PoRT = require('./PoRT.js');
const Cosig = require('./cosig.js');
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const BN = require('bn.js');
const elliptic = require('elliptic');
// eslint-disable-next-line new-cap
const ecdsa = new elliptic.ec('secp256k1');


/**
 * Creater is responsible for creating blocks and communicate with voter to generate cosignature
 * @class
 * @param  {string} port - Network port number of the creator
 * @param  {string} wallet - Wallet public key of the creator
 * @param  {MPT} MPT - Local Merkle Patricia Trie copy of the creator
 */
function Creator(port, wallet, MPT) {
  this.MPT = MPT;
  this.port = port;
  this.wallet = wallet;
}

/**
 * Check if the caller is selected as creator to perform actions for the current round of block construction, by passing publickey into MPT function
 * @return {bool} True if the caller is the creator of the current round of block construction; False otherwise
 */
Creator.prototype.isValid = function() {
  return (this.MPT.Verify(this.wallet.publicKey.encode('hex')) == 1);
};
/**
 * Create a Block, adding transactions, MPT and metadata into it
 * @param  {list} pendingTxs
 * @param  {Number} height
 * @param  {string} previousHash
 * @return {Block} created block
 */
Creator.prototype.constructNewBlock = function(pendingTxs, height, previousHash) {
  /* for (var i = 0; i < pendingTxs.length; i++) {
        this.MPT.UpdateValue(pendingTxs[i].sender, pendingTxs[i].receiver, pendingTxs[i].value);
    }*/
  this.cosig = new Cosig();
  this.block = new Block(height, pendingTxs.transactions, previousHash, this.MPT);

  return this.block;
};

/**
 * Get voter from network and add to the list
 * @param  {string} voterUrl - Voter's network url
 * @param  {string} voterPubKey - Wallet public key of voter
 * @param  {string} voterPubV - Round public V of voter
 * @param  {int}    voterIndex - record which Voter have attend the GetResponse with index of VoterUrl
 */
Creator.prototype.getVoter = function(voterUrl, voterPubKey, voterPubV) {
  if (this.voterUrl == null) {
    this.voterUrl = [voterUrl];
    this.voterPubKey = [voterPubKey];
    this.voterPubV = [voterPubV];
  } else {
    this.voterUrl.push(voterUrl);
    this.voterPubKey.push(voterPubKey);
    this.voterPubV.push(voterPubV);
  }
};

Creator.prototype.setVoterIndex = function(index) {
  if (this.voterIndex == null) {
    this.voterIndex = [index];
  } else {
    this.voterIndex.push(index);
  }
};

Creator.prototype.generateChallenge = function() {
  this.challenge = this.cosig.generateChallenge(this.voterPubV, this.block);
  return this.challenge.toString('hex');
};

Creator.prototype.generateChallengeWithIndex = function() {
  this.challenge = this.cosig.generateChallenge(this.voterPubV, this.block, this.voterIndex);
  return this.challenge.toString('hex');
};

Creator.prototype.getChallenge = function() {
  return this.challenge.toString('hex');
};

Creator.prototype.getResponses = function(VoterResponseHex) {
  const VoterResponse = new BN(VoterResponseHex, 'hex');
  if (this.voterResponse == null) {
    this.voterResponse = [VoterResponse];
  } else {
    this.voterResponse.push(VoterResponse);
  }
};

Creator.prototype.clearResponses = function() {
  this.voterResponse = null;
};


Creator.prototype.aggregateResponse = function() {
  this.r0Aggr = this.cosig.aggregateResponse(this.voterResponse);

  if (this.verifyCoSig()) {
    this.block.Cosig = this.cosig;
  }
};

Creator.prototype.verifyCoSig = function() {
  const responseKeypair = ecdsa.keyFromPrivate(this.r0Aggr.toString(16));
  const gr0 = responseKeypair.getPublic();
  const x0c = this.cosig.computePubkeyMulWithChallenge(this.voterPubKey, this.challenge);
  const checkResult = this.cosig.verifyCosig(gr0, x0c, this.challenge, this.block);

  return checkResult;
};

/**
 * Complete the generation of current new block
 * @param  {string} previousHash - hash value of the last block
 * @param {Block} lastBlock - last block
 * @return {Block} the completed new block
 */
Creator.prototype.completeBlock = function(previousHash, lastBlock) {
  const creatorPoRT = new PoRT(lastBlock.nextCreator, this.MPT, 1);
  this.block.nextCreator = creatorPoRT.nextMaintainer;
  for (let i = 0; i < lastBlock.nextVoters.length; i++) {
    const voterPoRT = new PoRT(lastBlock.nextVoters[i], this.MPT, 2);
    this.block.nextVoters.push(voterPoRT.nextMaintainer);
  }
  this.block.hash = this.block.hashBlock(previousHash, this.block);
  return this.block;
};

Creator.prototype.selectNewMaintainer = function(rootMaintainerAddress, previousBlockHash) {
  const newPoRT = new PoRT(rootMaintainerAddress, this.MPT, rootMaintainerAddress.Dbit);
};


module.exports = Creator;
