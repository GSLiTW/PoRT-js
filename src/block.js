const sha256 = require("sha256");
const Pending_Transaction_Pool = require("./pending_transaction_pool")

function Block(height, pendingTransactions, previousHash, MPT) {
    //fixed area
    this.previousBlockHash = previousHash,
    this.merkleRoot = MPT.Cal_hash(),
    this.timestamp = Date.now(),
    this.height = height,
    this.transactions = new Pending_Transaction_Pool(pendingTransactions),
    
    //variable area
    this.receiptTree = null,
    this.coSignature = NaN,
    this.nextCreator = NaN,
    this.nextVoters = [],
    this.hash = NaN
};

Block.prototype.hashBlock = function(previousBlockHash, currentBlockData){
    const dataAsString = previousBlockHash + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash;
};

module.exports = Block;