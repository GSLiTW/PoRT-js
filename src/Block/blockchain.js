const currentNodeUrl = process.argv[3];

// local modules
const Block = require("./block");
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
function Blockchain(MPT) {
  this.chain = [];
  // this.pendingTransactions = [];

  this.currentNodeUrl = currentNodeUrl;
  this.networkNodes = [];
  // pase json to get data

  var block1Txs = JSON.parse(fs.readFileSync('./src/Block/Block1txs.json', 'utf8'));
  let InitTxs = []
  for(let i = 0; i<Object.keys(block1Txs.txs).length; i++){
    InitTxs.push(new Transaction_MT(block1Txs.txs[i].id, block1Txs.txs[i].sender, block1Txs.txs[i].receiver, block1Txs.txs[i].value, block1Txs.txs[i].sig, MPT))
  }
  this.txn_pool = new Txn_Pool(InitTxs);


  let genesisData;
  const dataFile = fs.readFileSync('./src/Block/genesisBlock.json');
  try {
    genesisData = JSON.parse(dataFile);
    // console.log('JSON string:', 'utf8', genesisData);
  } catch (err) {
    console.log('Error parsing JSON string:', err);
  }
  const genesisBlock = new Block(
      1, // height
      this.txn_pool.transactions,
      '0', // previous Hash
      MPT,
  );
  this.txn_pool.clean()
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
Blockchain.prototype.createNewBlock = function (
  pendingTransactions,
  previousHash,
  MPT
) {
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
