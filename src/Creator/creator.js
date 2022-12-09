const Block = require('../Block/block');
const PoRT = require('./PoRT.js');
const BN = require('bn.js');
const elliptic = require('elliptic');
const ecdsa = new elliptic.ec('secp256k1');
const Cosig = require('../cosig.js');


/**
 * Creater is responsible for creating blocks and communicate with voter to generate cosignature
 * @class
 * @param  {string} port - Network port number of the creator
 * @param  {string} wallet - Wallet public key of the creator
 * @param {Blockchain} blockchain - Local  blockchain
 */
function Creator(port, wallet, blockchain) {
  this.MPT = blockchain.MPT;
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
  const roundNum = (lastBlock.height+1)%2;
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
// Creator.prototype.constructNewBlock = function(pendingTxs, height, previousHash) {
//   this.cosig = new Cosig();
//   this.block = new Block(height, pendingTxs.transactions, previousHash, this.MPT);
//   return this.block;
// };

Creator.prototype.startCosig = function() {
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
    this.block.cosig = this.cosig;
    this.selectMaintainer();
    this.blockchain.MPT = this.MPT;
    this.completeBlock();
  }
};

Creator.prototype.verifyCoSig = function() {
  const responseKeypair = ecdsa.keyFromPrivate(this.r0Aggr.toString(16));
  const gr0 = responseKeypair.getPublic();
  const x0c = this.cosig.computePubkeyMulWithChallenge(this.voterPubKey, this.challenge);
  const checkResult = this.cosig.verifyCosig(gr0, x0c, this.challenge, this.block);

  return checkResult;
};

Creator.prototype.completeBlock = function() {
  this.blockchain.MPT.ResetSaved();
  this.blockchain.txn_pool.clean();
  const nextCreator = this.blockchain.getLastBlock().nextCreator;
  this.block.hash = this.block.hashBlock(this.blockchain.getLastBlock().hash, this.block);
  this.blockchain.MPT.UpdateDbit(this.wallet.publicKey, [0, 0]);
  for (let i = 0; i < this.blockchain.getLastBlock().nextVoters.length; i++) {
    this.blockchain.MPT.UpdateDbit(this.blockchain.getLastBlock().nextVoters[i], [0, 0]);
  }
  this.blockchain.chain.push(this.block);
  if (this.block.height % 2 === 1) {
    this.blockchain.MPT.UpdateDbit(nextCreator, [2, 1]);
    for (let i = 0; i < this.block.nextVoters.length; i++) {
      this.blockchain.MPT.UpdateDbit(this.block.nextVoters[i], [1, 2]);
    }
  } else {
    this.blockchain.MPT.UpdateDbit(nextCreator, [1, 1]);
    for (let i = 0; i < this.block.nextVoters.length; i++) {
      this.blockchain.MPT.UpdateDbit(this.block.nextVoters[i], [2, 2]);
    }
  }
};

/**
 * Complete the generation of current new block
 * @param  {string} txspool - block transaction in  pool
 * @return {Block} the completed new block
 */
Creator.prototype.constructNewBlock = function(txspool) {
  if (!this.MPT.saved) {
    this.block = new Block(this.blockchain.getLastBlock().height + 1, txspool.transactions, this.blockchain.getLastBlock().hash, this.MPT);
    this.MPT = this.block.updateMPT();
    this.MPT.Cal_old_hash();
    return this.block;
  }
};

Creator.prototype.selectMaintainer = function() {
  this.MPT.RefundTax(this.wallet.publicKey.encode('hex'), this.MPT.Search(this.wallet.publicKey.encode('hex')).Tax());
  // const tmpBlock = this.blockchain.getLastBlock();
  const tmpBlock = this.blockchain.getBlock(this.blockchain.getLastBlock().previousBlockHash);
  for (let i = 0; i < tmpBlock.nextVoters.length; i++) {
    this.MPT.RefundTax(tmpBlock.nextVoters[i], this.MPT.Search(tmpBlock.nextVoters[i].toString('hex')).Tax());
  }

  const creatorPoRT = new PoRT(this.wallet.publicKey, this.MPT);
  this.block.nextCreator = creatorPoRT.nextMaintainer;

  for (let i = 0; i < tmpBlock.nextVoters.length; i++) {
    const voterPoRT = new PoRT(tmpBlock.nextVoters[i], this.MPT);
    this.block.nextVoters.push(voterPoRT.nextMaintainer);
  }
};


module.exports = Creator;
