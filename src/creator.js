const Block = require('./block.js');
const PoRT = require('./PoRT.js');
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const BN = require('bn.js');

/**
 * Generate & Initialize Creator Class
 * @class Creater is responsible for creating blocks and communicate with voter to generate cosignature
 * @param  {string} port - Network port number of the creator
 * @param  {string} pubKey - Wallet public key of the creator
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
Creator.prototype.IsValid = function() {
  return (this.MPT.Verify(this.wallet.publicKey.encode('hex')) == 1);
};
/**
 * Create a Block, adding transactions, MPT and metadata into it
 * @param  {list} pendingTxs
 * @param  {Number} height
 * @param  {string} previousHash
 * @return {Block} created block
 */
Creator.prototype.Create = function(pendingTxs, height, previousHash) {
  // console.log(this.MPT.Cal_hash());

  /* for (var i = 0; i < pendingTxs.length; i++) {
        this.MPT.UpdateValue(pendingTxs[i].sender, pendingTxs[i].receiver, pendingTxs[i].value);
    }*/

  // console.log(this.MPT.Cal_hash());

  this.block = new Block(height, pendingTxs.transactions, previousHash, this.MPT);

  return this.block;
};

/**
 * Get voter from network and add to the list
 * @param  {string} VoterUrl - Voter's network url
 * @param  {string} VoterPubKey - Wallet public key of voter
 * @param  {string} VoterPubV - Round public V of voter
 * @param  {int}    VoterIndex - record which Voter have attend the GetResponse with index of VoterUrl
 */
Creator.prototype.GetVoter = function(VoterUrl, VoterPubKey, VoterPubV) {
  if (this.VoterUrl == null) {
    this.VoterUrl = [VoterUrl];
    this.VoterPubKey = [VoterPubKey];
    this.VoterPubV = [VoterPubV];
  } else {
    this.VoterUrl.push(VoterUrl);
    this.VoterPubKey.push(VoterPubKey);
    this.VoterPubV.push(VoterPubV);
  }
};

Creator.prototype.setVoterIndex = function(index) {
  if (this.VoterIndex == null) {
    this.VoterIndex = [index];
  } else {
    this.VoterIndex.push(index);
  }
};

Creator.prototype.GenerateChallenge = function() {
  this.V0_aggr = this.VoterPubV[0];
  for (let i = 1; i < this.VoterPubV.length; i++) {
    this.V0_aggr = this.V0_aggr.add(this.VoterPubV[i]);
  }

  // console.log("\nV0_aggr: " + this.V0_aggr.encode('hex'));

  hash.update(this.V0_aggr.encode('hex') + this.block);
  this.challenge = new BN(hash.copy().digest('hex'), 'hex');

  return this.challenge.toString('hex');
};

Creator.prototype.GenerateChallengeWithIndex = function() {
  this.V0_aggr = this.VoterPubV[this.VoterIndex[0]];
  for (let i = 1; i < this.VoterIndex.length; i++) {
    this.V0_aggr = this.V0_aggr.add(this.VoterPubV[this.VoterIndex[i]]);
  }

  // console.log("\nV0_aggr: " + this.V0_aggr.encode('hex'));

  hash.update(this.V0_aggr.encode('hex') + this.block);
  this.challenge = new BN(hash.copy().digest('hex'), 'hex');

  return this.challenge.toString('hex');
};

Creator.prototype.GetChallenge = function() {
  return this.challenge.toString('hex');
};

Creator.prototype.GetResponses = function(VoterResponseHex) {
  const VoterResponse = new BN(VoterResponseHex, 'hex');
  // console.log(VoterResponse);
  if (this.VoterResponse == null) {
    this.VoterResponse = [VoterResponse];
  } else {
    this.VoterResponse.push(VoterResponse);
  }
};

Creator.prototype.ClearResponses = function() {
  this.VoterResponse = null;
};


Creator.prototype.AggregateResponse = function() {
  this.r0_aggr = this.VoterResponse[0];
  for (let i = 1; i < this.VoterResponse.length; i++) {
    this.r0_aggr = this.r0_aggr.add(this.VoterResponse[i]);
  }
  // console.log(this.r0_aggr.toString(16));

  if (this.VerifyCoSig()) {
    this.GetCoSig();
  }
};

Creator.prototype.VerifyCoSig = function() {
  const keys = this.wallet.NewKeyPair(this.r0_aggr.toString(16));
  const G_r0 = keys[1];
  // console.log("\nG_r0:" + G_r0.encode('hex'));

  let X0 = this.VoterPubKey[0];
  for (let i = 1; i < this.VoterPubKey.length; i++) {
    X0 = X0.add(this.VoterPubKey[i]);
  }
  // console.log("\nX0: " + X0.encode('hex'));

  const X0_c = X0.mul(this.challenge);

  if (this.V0_aggr.eq(G_r0.add(X0_c))) {
    console.log('%c\nCosig Verify Result: Passed :)', 'color:green;');
  } else {
    console.log('%c\nCosig Verify Result: Failed :(', 'color:red;');
  }

  return this.V0_aggr.eq(G_r0.add(X0_c));
};

/**
 * The final step of communication: store cosignature in the block
 * @param  {string} cosig - cosignature generated from voter.combinepartialsign
 */
Creator.prototype.GetCoSig = function() {
  this.block.CoSig = {
    c: this.challenge,
    r0_aggr: this.r0_aggr,
  };
};
/**
 * Complete the generation of current new block
 * @param  {string} previousHash - hash value of the last block
 * @return the completed new block
 */
Creator.prototype.GetBlock = function(previousHash, lastBlock) {
  const creatorPoRT = new PoRT(lastBlock.nextCreator, this.MPT, 1);
  this.block.nextCreator = creatorPoRT.next_maintainer[1];
  for (let i = 0; i < lastBlock.nextVoters.length; i++) {
    const voterPoRT = new PoRT(lastBlock.nextVoters[i], this.MPT, 2);
    this.block.nextVoters.push(voterPoRT.next_maintainer[1]);
  }
  this.block.hash = this.block.hashBlock(previousHash, this.block);
  return this.block;
};


module.exports = Creator;
