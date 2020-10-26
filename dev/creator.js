const Block = require("./block.js");
const PoRT = require("./PoRT.js");
const randomBytes = require('random-bytes');
const randomBuffer = (len) => Buffer.from(randomBytes.sync(len));
const BigInteger = require('bigi');
const schnorr = require('bip-schnorr');
const { pubKeyCombine } = require("bip-schnorr/src/mu-sig");
const convert = schnorr.convert;
const muSig = schnorr.muSig;


function Creator(port, pubKey, MPT){
    this.MPT = MPT;
    this.port = port;
    this.pubKey = pubKey;
}

Creator.prototype.IsValid = function() {
    return (this.MPT.Verify(this.pubKey) == 1);
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

Creator.prototype.PoRT = function() {
    var T = 1234;
    T = T.toString();
    var tmp = sha256(T + this.account[6].address);
    var h = parseInt(tmp, 16) % T;
    console.log(h);
}

Creator.prototype.Create = function(pendingTxs, height, previousHash) {
    
    for(var i = 0; i < pendingTxs.length; i++){
        this.MPT.UpdateValue(pendingTxs[i].sender, pendingTxs[i].receiver, pendingTxs[i].value);
    }

    this.block = new Block(height, pendingTxs, previousHash, this.MPT);

    return this.block;
}

Creator.prototype.GetVoter = function(VoterUrl, VoterPubKey) {
    if(this.VoterUrl == null) {
        this.VoterUrl = [VoterUrl];
        this.VoterPubKey = [VoterPubKey];
    } else {
        this.VoterUrl.push(VoterUrl);
        this.VoterPubKey.push(VoterPubKey);
    }
    // console.log(this.VoterUrl)
}

Creator.prototype.GetSignerSession = function(SignerSession) {
    this.SignerSession = SignerSession;
}

Creator.prototype.GetCommitments = function(VoterCommitment, VoterPubKey) {
    var idx = this.VoterPubKey.indexOf(VoterPubKey);
    if(this.commitments == null) {
        this.commitments = []
        for(var i=0; i < this.VoterPubKey.length; i++) {
            this.commitments.push(null);
        }
    }

    this.commitments[idx] = VoterCommitment;
    for(var i in this.commitments) {
        if(this.commitments[i] == null) {
            return false;
        }
    }

    // console.log(true)
    return true;
}

Creator.prototype.GetNonces = function(VoterNonce, VoterPubKey) {
    var idx = this.VoterPubKey.indexOf(VoterPubKey);
    if(this.nonces == null) {
        this.nonces = []
        for(var i=0; i < this.VoterPubKey.length; i++) {
            this.nonces.push(null);
        }
    }

    this.nonces[idx] = VoterNonce;
    for(var i in this.nonces) {
        if(this.nonces[i] == null) {
            return false;
        }
    }

    return true;
}

Creator.prototype.GetPartialSigns = function(VoterPartialSign, VoterPubKey) {
    var idx = this.VoterPubKey.indexOf(VoterPubKey);
    if(this.partialsigns == null) {
        this.partialsigns = []
        for(var i=0; i < this.VoterPubKey.length; i++) {
            this.partialsigns.push(null);
        }
    }

    this.partialsigns[idx] = VoterPartialSign;
    for(var i in this.partialsigns) {
        if(this.partialsigns[i] == null) {
            return false;
        }
    }

    return true;
}

//尚未改成MPT
//還要計算vote完回傳的block之variable area
Creator.prototype.Calculate = function() {
    this.isNewMappingTableVoted = 1;

    for(var i = this.pendingTxs.length - 1; i >= 0; i--){
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
        return null;
    }

    //calculate MPT root
    //call MPT API

    //clear the bits of creator and voter, and randomly select next creator and voter
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


module.exports = Creator;