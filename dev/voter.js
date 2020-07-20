/* 
 * CAUTION: NOT YET DEBUGGED
 */

function Voter(ID, mappingTable) {

    this.MPT_from_creator = mappingTable;
    this.ID = ID;
    this.Verify();
}

Voter.prototype.GetGlobalMPT = function(GlobalMPT) {
    this.MPT_global = GlobalMPT;
}

Voter.prototype.Verify = function(GlobalMPT) {
    if(this.ID < GlobalMPT.numOfAddress) {
        for(var i = 0; i < GlobalMPT.numOfAddress; i++) {
            if(GlobalMPT.account[i].ID == this.ID) {
                if(GlobalMPT.account[i].voter_bit = 1) {
                    this.IsVoter = 1;
                } else {
                    this.IsVoter = 0;
                    break;
                }
            }
        }
    }
    if(this.IsVoter == null) {
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

    if(this.MPT_from_creator.numOfAddress != this.MPT_global.numOfAddress) {
        return false;
    }

    for(var i = 0; i < this.MPT_global.numOfAddress; i++) {
        if(this.MPT_global.account[i].balance != this.MPT_from_creator.account[i].balance) {
            return false;
        }
    }

    return true;
}

module.exports = Voter;