const currentNodeUrl = process.argv[3];

// local modules
const Block = require('./block.js');
const Transaction_MT = require('./transaction.js');
const Txn_Pool = require('./pending_transaction_pool');

const TRANSACTION_TYPE = {
    transaction: "TRANSACTION",
    stake: "STAKE",
    validator_fee: "VALIDATOR_FEE"
};

/**
 * Generate & Initialize Blockchain Class
 * @class The main data structure of PORT blockchain
 * @param  {MPT} MPT
 */
function Blockchain(MPT){
    this.chain = [];
    // this.pendingTransactions = [];

    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];
  
    // this.accounts = new Account();
    // this.address = this.accounts.getAddress();
    var txn_pool = new Txn_Pool();
    txn_pool.create(1);
    var genesisBlock = new Block(4000718, txn_pool.transactions, '0xa3d2f1958efa84f053faf7eb14d2c104bef35b3098c23c5034678034c86ec183', MPT);
    genesisBlock.timestamp = 1604671786702;
    genesisBlock.hash = '0xa3d2f1958efa84f053faf7eb14d2c104bef35b3098c23c5034678034c86ec183';
    genesisBlock.nextCreator = '04bfde01a8a6973c4ece805f9a46f83d076a00e310e37351b50ee9a619838ce19e6dca73814b3557845140d0e97850487277b5a7ba87f26bd0cf9d943ce7623b9b';
    genesisBlock.nextVoters = ['046fbf49bb8134c53d50595895283d4ce3b09473561219c6869ee2300af5481553e43d84d49837bd5a73fe6a3ab9337ef68532e1bf14ef83fb2d42eaa55c237680', '0482c4b01761ab85fcabebbb1021e032ac58c62d184a80a588e7ba6d01928cb0402bb174b6e7e9ce7528630bc9963bf7643320365ab88ee6500ad3eb2f91e0efcd', '0446a08e02df8950c6c5d1a1199747efab9fb5aadcdd79a95139f35bfbcf31f9ef8b116bad1012984521b6e7f07d1d8c67894d7d52880f894c93ff9c0aff439eb4'];
    this.chain.push(genesisBlock)   //create Genesis Block
}

/**
 * Generate new block and append it to chain
 * @param  {list} pendingTransactions
 * @param  {string} previousHash
 * @param  {MPT} MPT
 * @return {Block} New Block
 */
Blockchain.prototype.createNewBlock = function(pendingTransactions, previousHash, MPT){
    var newBlock = new Block(this.getLastBlock().height+1, pendingTransactions, previousHash, MPT)

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
};
/**
 * @return {Block} Last Block
 */
Blockchain.prototype.getLastBlock = function(){
    return this.chain[this.chain.length-1];
};

/**
 * Add transaction to pending transaction
 * @param  {Transaction_MT} transactionObj
 * @return {Block} Last Block
 */
 Blockchain.prototype.addTransactionToPendingTransaction = function(transactionObj){
    let isexist = false;
    for(let i = 0; i < this.pendingTransactions.length; i++){
        if(this.pendingTransactions[i] == transactionObj){
            isexist = true;
            break;
        }
    }
    if(!isexist){
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
Blockchain.prototype.getBlock = function(blockHash){

    let correctBlock = null;
    this.chain.forEach(block =>{
        if(block.hash === blockHash)
            correctBlock = block;
    });

    return correctBlock;
};
/**
 * get transaction from chain by its id
 * @param  {string} transactionId
 * @return {Transaction_MT,Block} transaction and the block where it is located
 */
Blockchain.prototype.getTransaction = function(transactionId){

    let correctTransaction = null;
    let correctBlock = null
    this.chain.forEach(block =>{
        block.transactions.forEach(transaction =>{
            if(transaction.transactionId == transactionId){
                correctTransaction = transaction;
                correctBlock = block;
            }
        });
    });

    return {
        transaction: correctTransaction,
        block: correctBlock
    };
};

/*
 *  TODO: This function (method) should be in wallet.js
 */
Blockchain.prototype.getAddressData = function(address){
    const addressTransactions = [];
    this.chain.forEach(block =>{
        block.transactions.forEach(transaction =>{
            if(transaction.sender === address || transaction.recipient === address)
            addressTransactions.push(transaction);
        });
    });

    let balance = 0;
    addressTransactions.forEach(transaction =>{
        if(transaction.recipient === address)
            balance += transaction.amount;
        if(transaction.sender === address)
            balance -= transaction.amount;
    });

    return {
        addressTransactions: addressTransactions,
        addressBalance : balance
    }

}


module.exports = Blockchain;