const vt = require("./voter.js");

function Creator(ID, mappingTable, pendingTxPool){
    this.creator = -1;
    this.isCreatorVerified = -1;
    this.newMappingTable = mappingTable;
    this.pendingTxs = pendingTxPool.get_transaction();
    this.isNewMappingTableVoted = -1;
}

Creator.prototype.CreatorVerify = function(ID, mappingTable) {
    this.creator = -1;
    this.isCreatorVerified = -1;

    if(mappingTable.account == null){
        console.log("Mapping Table is not valid!");
        return -1;
    }

    for(var i = 0; i < mappingTable.numOfAddress; i++){
        if(mappingTable.account[i].creator_bit == 1 && mappingTable.account[i].address == ID){
            this.creator = ID;
            this.isCreatorVerified = 1;
            return 1;
        }
    }

    console.log("Creator error!");
    return -1;
}

Creator.prototype.CreatorCreate = function(ID) {
    this.isNewMappingTableVoted = -1;

    for(var i = 0; i < this.pendingTxs.length; i++){
        if(this.newMappingTable.account.address == pendingTxs[i].sender){
            this.newMappingTable.account.transactions.push(pendingTxs[i]);
            this.newMappingTable.account.balance -= pendingTxs[i].value;
        }
        if(this.newMappingTable.account.address == pendingTxs[i].receiver){
            this.newMappingTable.account.transactions.push(pendingTxs[i]);
            this.newMappingTable.account.balance += pendingTxs[i].value;
        }
    }

    return 1;
}

Creator.prototype.CreatorVoter = function(ID, mappingTable) {
    this.isNewMappingTableVoted = -1;
    var Voter = new vt(ID, this.newMappingTable);
    
    if(Voter.Vote() == true){
        console.log("Voting successed!");
        return this.newMappingTable;
    }

    console.log("Voting failed!");
    return null;
}

module.exports = Creator;