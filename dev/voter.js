/* 
 * CAUTION: NOT YET DEBUGGED
 */

const sha256 = require("sha256");

function Voter(ID, GlobalMPT, CreatorMPT, TxPool) {
    this.CreatorMPT = CreatorMPT;
    this.GlobalMPT = GlobalMPT;
    this.TxPool = TxPool.get_transaction();
    this.ID = ID;
    this.Verify();
}

Voter.prototype.Verify = function() {
    //console.log(this.GlobalMPT.numOfAddress);
    if(1) {
        for(var i = 0; i < this.GlobalMPT.numOfAddress; i++) {
            
            if(this.GlobalMPT.account[i].address == this.ID) {
                
                if(this.GlobalMPT.account[i].voter_bit = 1) {
                    this.IsVoter = 1;
                } else {
                    this.IsVoter = 0;
                    break;
                }
            }
        }
    }
    
    if(this.IsVoter == undefined) {
        console.log("Error: ID does not match to MPT!\n");
    }
}


/*
 * Voting Function: 
 *                  Check whether status given from creator matches the global status
 */
Voter.prototype.Vote = function() {
    if(this.IsVoter != 1) {
        console.log("Error: Calling vote function without voter bit!\n");
        return false;
    }

    if(this.CreatorMPT.numOfAddress != this.GlobalMPT.numOfAddress) {
        return false;
    }

    for(var i = 0; i < this.GlobalMPT.numOfAddress; i++) {
        if(this.GlobalMPT.account[i].balance != this.CreatorMPT.account[i].balance) {
            return false;
        }
    }

    for(var i = 0; i < this.TxPool.length; i++){
        for(var j = 0; j < this.CreatorMPT.numOfAddress; j++){
            if(this.TxPool[i].sender == this.CreatorMPT.account[j].address){
                var find = false;
                for(var tx = 0; tx < this.CreatorMPT.account[j].transactions.length; tx++) {
                    if(this.CreatorMPT.account[j].transactions[tx] == this.TxPool[i]) {
                        find = true;
                    }
                }
                if(find == false) {
                    return false;
                }
            }
            
            if(this.TxPool[i].receiver == this.CreatorMPT.account[j].address){
                var find = false;
                for(var tx = 0; tx < this.CreatorMPT.account[j].transactions.length; tx++) {
                    if(this.CreatorMPT.account[j].transactions[tx] == this.TxPool[i]) {
                        find = true;
                    }
                }
                if(find == false) {
                    return false;
                }
            }
        }        
    }

    return true;
}

Voter.prototype.PoRT = function() {
    var T = 1234;
    T = T.toString();
    var tmp = sha256(T + this.account[6].address);
    var h = parseInt(tmp, 16) % T;
    console.log(h);
}

module.exports = Voter;