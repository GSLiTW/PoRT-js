const sha256 = require("sha256");

function Block(height, pendingTransactions, previousHash) {
    //fixed area
    this.height = height,
    this.transactions = pendingTransactions,
    this.previousBlockHash = previousHash;
    if(previousHash == '0xa3d2f1958efa84f053faf7eb14d2c104bef35b3098c23c5034678034c86ec183') {
        this.timestamp = 0;
        this.merkleRoot = '0x6776d0e1350dd79726ec0f0b5b79dba248a699bffc3f20979ea628b3f8c806b3';
        this.nextCreator = '046fbf49bb8134c53d50595895283d4ce3b09473561219c6869ee2300af5481553e43d84d49837bd5a73fe6a3ab9337ef68532e1bf14ef83fb2d42eaa55c237680';
        this.nextVoters = ['043ba338b695e39d6ecb8ef5b4c16a0616f06f52f29a2068ead1f33274202b4c2798f0ef5be51f46df9f62e01f8d65a50a60ddbdf85b36607552626822a0f41921',
                            '04eb202d6e987838cbed07efad2725d26c92bb39bdeace5fba68f144ab6a22221d18fa4bc9884edbd141d9cb4702e0e151e83b3201d3f5bdbad8f8900f25494556',
                            '041b7d2482344f572464b4f49c5ac3e7343b5fffa613acf39d19b16a68af4f8993d772140c26c8ef43a80dc269b8dfdde6bbcf1fc2891f50030f7f57d496ee6eaf'];
        this.hash = this.hashBlock(previousHash, {timestamp: this.timestamp, merkleRoot: this.merkleRoot, 
            nextCreator: this.nextCreator, nextVoters: this.nextVoters, height: this.height, transactions: this.transactions});
    } else {
        this.timestamp = Date.now();
        this.merkleRoot = "";
        this.nextCreator = null;
        this.nextVoters = [];
        this.hash = null;
    }

    //variable area
    this.receiptTree = null;
    this.coSignature = null;
};

Block.prototype.hashBlock = function(previousBlockHash, currentBlockData){
    const dataAsString = previousBlockHash + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash;
};

module.exports = Block;