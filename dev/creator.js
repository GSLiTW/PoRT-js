function Creator(mappingTable, pendingTxPool){
    this.creator = -1;
    this.isCreatorVerified = -1;
    this.newMappingTable = mappingTable;
    this.pendingTxs = pendingTxPool.get_transaction();
    this.isNewMappingTableVoted = -1;
    this.nextCreatorIndex = -1;
    this.nextCreator = -1;
    this.nextVotersIndex = [];
    this.nextVoters = [];
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

Creator.prototype.CreatorCreate = function() {
    this.isNewMappingTableVoted = -1;

    for(var i = 0; i < this.pendingTxs.length; i++){
        for(var j = 0; j < this.newMappingTable.numOfAddress; j++){
            if(this.pendingTxs[i].sender == this.newMappingTable.account[j].address){
                this.newMappingTable.account[j].transactions.push(this.pendingTxs[i]);
            }
            if(this.pendingTxs[i].receiver == this.newMappingTable.account[j].address){
                this.newMappingTable.account[j].transactions.push(this.pendingTxs[i]);
            }
        }        
    }

    return this.newMappingTable;
}

Creator.prototype.CreatorCalculate = function() {
    this.isNewMappingTableVoted = 1;
    // console.log(this.pendingTxs)
    for(var i = this.pendingTxs.length -1; i >= 0 ; i--){
        for(var j = 0; j < this.newMappingTable.numOfAddress; j++){
            if(this.pendingTxs[i].sender == this.newMappingTable.account[j].address){
                this.newMappingTable.account[j].balance -= parseFloat(this.pendingTxs[i].value);
            }
            if(this.pendingTxs[i].receiver == this.newMappingTable.account[j].address){
                this.newMappingTable.account[j].balance += parseFloat(this.pendingTxs[i].value);
            }
        }
        this.pendingTxs.pop();
    }

    if(this.pendingTxs.length != 0){
        //console.log(this.pendingTxs.length)
        console.log("Clearing pendingTxs failed!");
    }


    for(var i = 0; i < this.newMappingTable.numOfAddress; i++){
        this.newMappingTable.account[i].creator_bit = 0;
        this.newMappingTable.account[i].voter_bit = 0;
    }

    this.nextCreatorIndex = Math.floor(Math.random() * Math.floor(this.newMappingTable.numOfAddress));
    this.nextCreator = this.newMappingTable.account[this.nextCreatorIndex].address;
    this.newMappingTable.account[this.nextCreatorIndex].creator_bit = 1;
    for(var i = 0; i < 3; i++){
        while(1){
            var index = Math.floor(Math.random() * Math.floor(this.newMappingTable.numOfAddress));
            if(i == 0){
                if(this.nextCreatorIndex != index){
                    this.nextVotersIndex.push(index);
                    this.nextVoters.push(this.newMappingTable.account[index].address);
                    this.newMappingTable.account[index].voter_bit = 1;
                    break;
                }
            }
            else if(i == 1){
                if(this.nextCreatorIndex != index && this.nextVotersIndex[i-1] != index){
                    this.nextVotersIndex.push(index);
                    this.nextVoters.push(this.newMappingTable.account[index].address);
                    this.newMappingTable.account[index].voter_bit = 1;
                    break;
                }
            }
            else if(i == 2){
                if(this.nextCreatorIndex != index && this.nextVotersIndex[i-1] != index && this.nextVotersIndex[i-2] != index){
                    this.nextVotersIndex.push(index);
                    this.nextVoters.push(this.newMappingTable.account[index].address);
                    this.newMappingTable.account[index].voter_bit = 1;
                    break;
                }
            }
        }
    }

    return this.newMappingTable;
}

Creator.prototype.PoRT = function() {
    var T = 1234;
    T = T.toString();
    var tmp = sha256(T + this.account[6].address);
    var h = parseInt(tmp, 16) % T;
    console.log(h);
}

module.exports = Creator;