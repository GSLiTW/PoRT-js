const ProofOfWork = require('./proof.js')

function Block(height, previousHash) {
    this.timestamp = Date.now(),
    this.previousBlockHash = previousHash,
    this.height = height

    // PoW = new ProofOfWork({index: this.index, transactions: this.transactions}, 12)
    // this.nonce = PoW.proof(previousHash, 
    //     {index: this.index, transactions: this.transactions} ),
    // this.hash = PoW.hashBlock(previousHash, 
    //     {index: this.index, transactions: this.transactions}, this.nonce )
};

module.exports = Block;