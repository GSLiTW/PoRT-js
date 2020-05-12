const ProofOfWork = require('./proof.js')

function Block(height, pendingTransactions, previousHash) {
    this.timestamp = Date.now(),
    this.transactions = pendingTransactions,
    this.previousBlockHash = previousHash,
    this.height = height,

    PoW = new ProofOfWork({index: this.index, transactions: this.transactions}, 12)
    this.nonce = PoW.proof(previousHash, 
        {index: this.index, transactions: this.transactions} ),
    this.hash = PoW.hashBlock(previousHash, 
        {index: this.index, transactions: this.transactions}, this.nonce )
};

// dummy for now
Block.prototype.Genesis = function() {
    return Block(0, [], "0")
}

module.exports = Block;