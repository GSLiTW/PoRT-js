const currentNodeUrl = process.argv[3];

// local modules
const Block = require('./block');
const Transaction_MT = require('../Transaction/transaction.js');
const Txn_Pool = require('../Transaction/pending_transaction_pool');
const fs = require('fs'); // for reading Genesis.json
const MPT =require('../MPT/MPT');
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
function Blockchain() {
  this.chain = [];
  // this.pendingTransactions = [];
  this.MPT = new MPT(true);
  this.currentNodeUrl = currentNodeUrl;
  this.networkNodes = [];
  // pase json to get data
  const genesisBlockJSON = fs.readFileSync('./src/Block/genesisBlock.json');
  const genesisData = JSON.parse(genesisBlockJSON);
  const secondBlockJSON = fs.readFileSync('./src/Block/secondBlock.json');
  const secondData = JSON.parse(secondBlockJSON);

  for (const allocid in genesisData.alloc) {
    this.MPT.Insert(genesisData.alloc[allocid].pubKey, genesisData.alloc[allocid].balance, genesisData.alloc[allocid].tax, genesisData.alloc[allocid].dbit);
  }

  const block1Txs = JSON.parse(fs.readFileSync('./src/Block/Block1txs.json', 'utf8'));
  const InitTxs = [];
  for (let i = 0; i<Object.keys(block1Txs.txs).length; i++) {
    InitTxs.push(new Transaction_MT(block1Txs.txs[i].id, block1Txs.txs[i].sender, block1Txs.txs[i].receiver, block1Txs.txs[i].value, block1Txs.txs[i].sig, this.MPT));
  }
  this.txn_pool = new Txn_Pool(InitTxs);
  const genesisBlock = new Block(
      1, // height
      this.txn_pool.transactions,
      '0', // previous Hash
      this.MPT,
  );

  this.MPT = genesisBlock.updateMPT();
  this.MPT.Cal_old_hash();
  this.MPT.ResetSaved();

  genesisBlock.timestamp = genesisData.timestamp;
  genesisBlock.nextCreator = genesisData.nextCreator;
  genesisBlock.nextVoters = genesisData.nextVoters;
  genesisBlock.hash = '501cdbedcea248f8f5c832998b02b0b0a09d10ee13c9f38fd1e2aab73719bf6a';
  this.chain.push(genesisBlock); // create Genesis Block
  this.txn_pool.clean();

  // second Block
  const block2Txs = JSON.parse(fs.readFileSync('./src/Block/Block2txs.json', 'utf8'));
  const Init2Txs = [];
  for (let i = 0; i<Object.keys(block2Txs.txs).length; i++) {
    Init2Txs.push(new Transaction_MT(block2Txs.txs[i].id, block2Txs.txs[i].sender, block2Txs.txs[i].receiver, block2Txs.txs[i].value, block2Txs.txs[i].sig, this.MPT));
  }
  this.txn_pool = new Txn_Pool(Init2Txs);

  const secondBlock = new Block(
      2, // height
      this.txn_pool.transactions,
      '501cdbedcea248f8f5c832998b02b0b0a09d10ee13c9f38fd1e2aab73719bf6a', // previous Hash
      this.MPT,
  );
  this.MPT = secondBlock.updateMPT();
  this.MPT.Cal_old_hash();
  this.MPT.ResetSaved();

  secondBlock.timestamp = secondData.timestamp;
  secondBlock.nextCreator = secondData.nextCreator;
  secondBlock.nextVoters = secondData.nextVoters;
  secondBlock.hash = secondData.hash;
  this.chain.push(secondBlock); // create Genesis Block
  this.txn_pool.clean();
}

/**
 * Generate new block and append it to chain
 * @param  {list} pendingTransactions
 * @param  {string} previousHash
 * @param  {MPT} MPT
 * @return {Block} New Block
 */
Blockchain.prototype.createNewBlock = function(pendingTransactions, previousHash, MPT) {
  const newBlock = new Block(
      this.getLastBlock().height + 1,
      pendingTransactions,
      previousHash,
      MPT,
  );
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
Blockchain.prototype.addTransactionToPendingTransaction = function(transactionObj) {
  const isexist = false;
  // console.log(transactionObj)
  txs = this.txn_pool.get_transaction();
  for (let i = 0; i < txs.length; i++) {
    if (txs[i].id == transactionObj.id) {
      // isexist = true;
      return true;
    }
  }
  if (!isexist) {
    this.txn_pool.addTx(transactionObj);
  }
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
    console.log(block);
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
