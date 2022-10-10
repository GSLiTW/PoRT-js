/* eslint-disable max-len */
const Block = require('../Block/block');
const PoRT = require('../Creator/PoRT.js');
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const BN = require('bn.js');
const elliptic = require('elliptic');
// eslint-disable-next-line new-cap
const ecdsa = new elliptic.ec('secp256k1');
const Cosig = require('../cosig.js');


/**
 * Creater is responsible for creating blocks and communicate with voter to generate cosignature
 * @class
 * @param  {string} port - Network port number of the creator
 * @param  {string} wallet - Wallet public key of the creator
 * @param  {MPT} MPT - Local Merkle Patricia Trie copy of the creator
 * @param {Blockchain} blockchain - Local  blockchain
 */
function Creator(port, wallet, MPT, blockchain) {
  this.MPT = MPT;
  this.port = port;
  this.wallet = wallet;
  this.blockchain = blockchain;
}

/**
 * Check if the caller is selected as creator to perform actions for the current round of block construction, by passing publickey into MPT function
 * @return {bool} True if the caller is the creator of the current round of block construction; False otherwise
 */
Creator.prototype.isValid = function() {
  const roundOfCreator = this.MPT.Verify(this.wallet.publicKey.encode('hex'))[0]%2;
  const identityOfCreator = this.MPT.Verify(this.wallet.publicKey.encode('hex'))[1];
  const lastBlock = this.blockchain.getLastBlock();
  const roundNum = lastBlock.height%2;
  let checksum;
  if (roundNum == roundOfCreator && identityOfCreator == 1) {
    checksum = 1;
  } else {
    checksum = 0;
  }
  return checksum;
};
/**
 * Create a Block, adding transactions, MPT and metadata into it
 * @param  {list} pendingTxs
 * @param  {Number} height
 * @param  {string} previousHash
 * @return {Block.block} created block
 */
Creator.prototype.startCosig = function(voteblock) {
  /* for (var i = 0; i < pendingTxs.length; i++) {
        this.MPT.UpdateValue(pendingTxs[i].sender, pendingTxs[i].receiver, pendingTxs[i].value);
    }*/
  this.cosig = new Cosig();
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
  this.challenge = this.cosig.generateChallenge(this.voterPubV, this.voteblock);
  return this.challenge.toString('hex');
};

Creator.prototype.generateChallengeWithIndex = function() {
  this.challenge = this.cosig.generateChallenge(this.voterPubV, this.voteblock, this.voterIndex);
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
    this.voteblock.CoSig = this.cosig;
    this.completeBlock();
  }
};

Creator.prototype.verifyCoSig = function () {
  const responseKeypair = ecdsa.keyFromPrivate(this.r0Aggr.toString(16));
  const gr0 = responseKeypair.getPublic();
  const x0c = this.cosig.computePubkeyMulWithChallenge(this.voterPubKey, this.getChallenge());
  const checkResult = this.cosig.verifyCosig(gr0, x0c, this.challenge, this.voteblock);

  return checkResult;
};

Creator.prototype.completeBlock = function () {
  const nextCreator = this.blockchain.getLastBlock().nextCreator;
  this.block.hash = this.block.hashBlock(this.blockchain.getLastBlock().hash, this.block);
  this.blockchain.chain.push(this.block);
  this.Tree.UpdateDbit(this.wallet.publicKey, [0, 0]);
  for (let i = 0; i < this.blockchain.getLastBlock().nextVoters.length; i++) {
    this.Tree.UpdateDbit(this.blockchain.getLastBlock().nextVoters[i], [0, 0]);
  }
  if (this.block.height % 2 === 1) {
    this.Tree.UpdateDbit(nextCreator, [2, 1]);
    for (let i = 0; i < this.block.nextVoters.length; i++) {
      this.Tree.UpdateDbit(this.block.nextVoters[i], [1, 2]);
    }
  } else {
    this.Tree.UpdateDbit(nextCreator, [1, 1]);
    for (let i = 0; i < this.block.nextVoters.length; i++) {
      this.Tree.UpdateDbit(this.block.nextVoters[i], [2, 2]);
    }
  }
  //TODO: change maintainer
};

/**
 * Complete the generation of current new block
 * @param  {string} previousHash - hash value of the last block
 * @param {Block} lastBlock - last block
 * @return {Block} the completed new block
 */
Creator.prototype.constructNewBlock = function (txspool) {
  this.block = new Block(this.blockchain.getLastBlock().height + 1, txspool.transactions, this.blockchain.getLastBlock().hash, this.MPT);
  this.MPT = this.block.updateMPT();
  return this.block;
};

Creator.prototype.selectMaintainer = function () {
  const creatorPoRT = new PoRT(this.wallet.publicKey, this.MPT);
  this.block.nextCreator = creatorPoRT.nextMaintainer;
  const tmpBlock = this.blockchain.getBlock(this.blockchain.getLastBlock().previousHash);
  for (let i = 0; i < tmpBlock.nextVoters.length; i++) {
    const voterPoRT = new PoRT(tmpBlock.nextVoters[i], this.MPT);
    this.block.nextVoters.push(voterPoRT.nextMaintainer);
  }
}


module.exports = Creator;
