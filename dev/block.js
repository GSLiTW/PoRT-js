const sha256 = require("sha256");

function Block(height, pendingTransactions, previousHash, MPT) {
    //fixed area
    this.previousBlockHash = previousHash,
    this.merkleRoot = MPT.Cal_hash(),
    this.timestamp = Date.now(),
    this.height = height,
    this.transactions = pendingTransactions,
    
    //variable area
    this.receiptTree = null,
    this.coSignature = NaN,
    this.hash = NaN     //this.hashBlock(previousHash, {index: this.index, transactions: this.transactions})
    this.nextCreator = NaN,
    this.nextVoters = [],
};

Block.prototype.hashBlock = function(previousBlockHash, currentBlockData){
    const dataAsString = previousBlockHash + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash;
};

module.exports = Block;