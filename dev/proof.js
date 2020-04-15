const sha256 = require("sha256");

function ProofOfWork(block, difficulty) {
    this.Block = block,
    this.Target = 1 << (256-difficulty)
}

ProofOfWork.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce){
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash;
};

ProofOfWork.prototype.proof = function(previousBlockHash, currentBlockData){
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while(hash.substring(0, 2) !== "00"){
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        //console.log(hash);
    }

    return nonce;
};

module.exports = ProofOfWork;