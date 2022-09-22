const currentNodeUrl = process.argv[3];

// local modules
const Block = require('./block');
const Transaction_MT = require('../Transaction/transaction.js');
const Txn_Pool = require('../Transaction/pending_transaction_pool');
const fs = require('fs'); // for reading Genesis.json

const TRANSACTION_TYPE = {
  transaction: 'TRANSACTION',
  stake: 'STAKE',
  validator_fee: 'VALIDATOR_FEE',
};

/**
 * Generate & Initialize Blockchain Class
 * @class The main data structure of PORT blockchain
 * @param  {MPT} MPT
 */
function Blockchain(MPT) {
  this.chain = [];
  // this.pendingTransactions = [];

  this.currentNodeUrl = currentNodeUrl;
  this.networkNodes = [];
  // pase json to get data

  const txn_pool = new Txn_Pool();
  txn_pool.create(1, MPT);

  let genesisData = require('../Block/genesisBlock.json');
  fs.readFile('../Block/genesisBlock.json', (err, data) => {
    if (err) {
      return console.log('Error reading file from disk:', err);
    }
    try {
      genesisData = JSON.parse(data);
      console.log('JSON string:', 'utf8', genesisData);
    } catch (err) {
      console.log('Error parsing JSON string:', err);
    }
  });
  const genesisBlock = new Block(
      1, // height
      txn_pool.transactions,
      0, // previous Hash
      MPT,
  );
  genesisBlock.timestamp = genesisData.timestamp;
  genesisBlock.hash = genesisData.hash;
  genesisBlock.nextCreator = genesisData.nextCreator;
  genesisBlock.nextVoters = genesisData.nextVoters;
  this.chain.push(genesisBlock); // create Genesis Block
}

/**
 * Generate new block and append it to chain
 * @param  {list} pendingTransactions
 * @param  {string} previousHash
 * @param  {MPT} MPT
 * @return {Block} New Block
 */
Blockchain.prototype.createNewBlock = function(
    pendingTransactions,
    previousHash,
    MPT,
) {
  const newBlock = new Block(
      this.getLastBlock().height + 1,
      pendingTransactions,
      previousHash,
      MPT,
  );

  this.pendingTransactions = [];
  this.chain.push(newBlock);

  return newBlock;
};
/**
 * @return {Block} Last Block
 */
Blockchain.prototype.getLastBlock = function() {
  return this.chain[this.chain.length - 1];
};

/**
 * Add transaction to pending transaction
 * @param  {Transaction_MT} transactionObj
 * @return {Block} Last Block
 */
Blockchain.prototype.addTransactionToPendingTransaction = function(
    transactionObj,
) {
  let isexist = false;
  for (let i = 0; i < this.pendingTransactions.length; i++) {
    if (this.pendingTransactions[i] == transactionObj) {
      isexist = true;
      break;
    }
  }
  if (!isexist) {
    this.pendingTransactions.push(transactionObj);
  }
  // return this.getLastBlock()["height"]+1;
  return isexist;
};

/**
 * Find block with given blockhash
 * @param  {string} blockHash
 * @return {Block} The correct Block
 */
Blockchain.prototype.getBlock = function(blockHash) {
  let correctBlock = null;
  this.chain.forEach((block) => {
    if (block.hash === blockHash) correctBlock = block;
  });

  return correctBlock;
};
/**
 * get transaction from chain by its id
 * @param  {string} transactionId
 * @return {Transaction_MT,Block} transaction and the block where it is located
 */
Blockchain.prototype.getTransaction = function(transactionId) {
  let correctTransaction = null;
  let correctBlock = null;
  this.chain.forEach((block) => {
    block.transactions.forEach((transaction) => {
      if (transaction.transactionId == transactionId) {
        correctTransaction = transaction;
        correctBlock = block;
      }
    });
  });

  return {
    transaction: correctTransaction,
    block: correctBlock,
  };
};

/*
 *  TODO: This function (method) should be in wallet.js
 */
Blockchain.prototype.getAddressData = function(address) {
  const addressTransactions = [];
  this.chain.forEach((block) => {
    block.transactions.forEach((transaction) => {
      if (transaction.sender === address || transaction.recipient === address) {
        addressTransactions.push(transaction);
      }
    });
  });

  let balance = 0;
  addressTransactions.forEach((transaction) => {
    if (transaction.recipient === address) balance += transaction.amount;
    if (transaction.sender === address) balance -= transaction.amount;
  });

  return {
    addressTransactions: addressTransactions,
    addressBalance: balance,
  };
};

module.exports = Blockchain;
