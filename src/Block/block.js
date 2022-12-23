const sha256 = require('sha256');

/**
 * Generate & Initialize Block Class
 * @class  Block of the Blockchain containing basics of Bitcoin/Ethereum blocks and information about creators and voters
 * @param  {Number} heightTransaction_MT
 * @param  {Transaction_MT} pendingTransactions
 * @param  {string} previousHash
 * @param  {MPT} MPT
 * @param {Cosig} cosig
 */
function Block(height, pendingTransactions, previousHash, MPT) {
  // fixed area
  this.MPT = MPT,
  this.previousBlockHash = previousHash,
  this.merkleRoot = this.MPT.Cal_hash(),
  this.timestamp = Date.now(),
  this.height = height,
  this.transactions = pendingTransactions.slice(0), // copy whole tx array

  // variable area
  this.receiptTree = null,
  this.cosig = null,
  this.nextCreator = [],
  this.nextVoters = [],
  this.hash = null;
};

/**
 * Generate hash of block
 * @param  {string} previousBlockHash
 * @param  {Block} currentBlockData
 * @return {string} hash of block
 */
Block.prototype.hashBlock = function(previousBlockHash, currentBlockData) {
  const dataAsString = previousBlockHash + JSON.stringify(currentBlockData);
  const hash = sha256(dataAsString);
  return hash;
};

Block.prototype.updateMPT = function() {
  for (let i = 0; i < this.transactions.length; i++) {
    const sender = this.transactions[i].sender;
    const receiver = this.transactions[i].receiver;
    const value = this.transactions[i].value;
    this.MPT.UpdateValue(sender, receiver, value);
  }
  this.merkleRoot = this.MPT.Cal_hash();
  return this.MPT;
};

module.exports = Block;
