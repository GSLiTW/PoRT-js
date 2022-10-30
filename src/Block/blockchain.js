const currentNodeUrl = process.argv[3];

// local modules
const Block = require("./block");
const MPT = require("../MPT/MPT");
const Transaction_MT = require("../Transaction/transaction.js");
const Txn_Pool = require("../Transaction/pending_transaction_pool");
const fs = require("fs"); //for reading Genesis.json

const TRANSACTION_TYPE = {
  transaction: "TRANSACTION",
  stake: "STAKE",
  validator_fee: "VALIDATOR_FEE",
};

/**
 * Generate & Initialize Blockchain Class
 * @class The main data structure of PORT blockchain
 * @param  {MPT} MPT
 */
function Blockchain() {
  this.chain = [];
  // this.pendingTransactions = [];
  this.MPT = new MPT();

  this.currentNodeUrl = currentNodeUrl;
  this.networkNodes = [];

  // pase json to get data
  const dataFile = fs.readFileSync('./src/Block/genesisBlock.json');
  // const allocData = JSON.parse(fs.readFileSync('./src/Block/InitialAlloc.json', 'utf8'));
  const genesisData = JSON.parse(dataFile);

  // for (let allocid = 0; allocid < Object.keys(allocData.alloc).length; allocid++) {
  //   this.MPT.Insert(allocData.alloc[allocid].pubKey, allocData.alloc[allocid].balance, allocData.alloc[allocid].tax, allocData.alloc[allocid].dbit);
  // }

  for (let allocid in genesisData.alloc) {
    this.MPT.Insert(genesisData.alloc[allocid].pubKey, genesisData.alloc[allocid].balance, genesisData.alloc[allocid].tax, genesisData.alloc[allocid].dbit);
  }

  var block1Txs = JSON.parse(fs.readFileSync('./src/Block/Block1txs.json', 'utf8'));
  let InitTxs = []
  for(let i = 0; i<Object.keys(block1Txs.txs).length; i++){
    InitTxs.push(new Transaction_MT(block1Txs.txs[i].id, block1Txs.txs[i].sender, block1Txs.txs[i].receiver, block1Txs.txs[i].value, block1Txs.txs[i].sig, this.MPT))
  }
  this.txn_pool = new Txn_Pool(InitTxs);


  const genesisBlock = new Block(
      1, // height
      this.txn_pool.transactions,
      '0', // previous Hash
      this.MPT,
  );

  this.MPT = genesisBlock.updateMPT();

  genesisBlock.timestamp = genesisData.timestamp;
  // genesisBlock.hash = genesisData.hash;
  genesisBlock.nextCreator = genesisData.nextCreator;
  genesisBlock.nextVoters = genesisData.nextVoters;
  hashValue = genesisBlock.hashBlock(0, genesisBlock);
  console.log(hashValue);
  genesisBlock.hash = hashValue;
  this.chain.push(genesisBlock); // create Genesis Block
}

/**
 * Generate new block and append it to chain
 * @param  {list} pendingTransactions
 * @param  {string} previousHash
 * @param  {MPT} MPT
 * @return {Block} New Block
 */
Blockchain.prototype.createNewBlock = function (pendingTransactions, previousHash, MPT) {
  var newBlock = new Block(
    this.getLastBlock().height + 1,
    pendingTransactions,
    previousHash,
    MPT
  );

  this.pendingTransactions = [];
  this.chain.push(newBlock);

  return newBlock;
};
/**
 * @return {Block} Last Block
 */
Blockchain.prototype.getLastBlock = function () {
  return this.chain[this.chain.length - 1];
};

/**
 * Add transaction to pending transaction
 * @param  {Transaction_MT} transactionObj
 * @return {Block} Last Block
 */
Blockchain.prototype.addTransactionToPendingTransaction = function (
  transactionObj
) {
  let isexist = false;
  //console.log(transactionObj)
  txs = this.txn_pool.get_transaction()
  for (let i = 0; i < txs.length; i++) {
    if (txs[i].id === transactionObj.id) {
      //isexist = true;
      return true;
    }
  }
  if (!isexist) {
    this.txn_pool.addTx(transactionObj);
  }
  // return this.getLastBlock()["height"]+1;
  return isexist;
};

/**
 * Find block with given blockhash
 * @param  {string} blockHash
 * @return {Block} The correct Block
 */
Blockchain.prototype.getBlock = function (blockHash) {
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
Blockchain.prototype.getTransaction = function (transactionId) {
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
Blockchain.prototype.getAddressData = function (address) {
  const addressTransactions = [];
  this.chain.forEach((block) => {
    block.transactions.forEach((transaction) => {
      if (transaction.sender === address || transaction.recipient === address)
        addressTransactions.push(transaction);
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
