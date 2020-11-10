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

// Creator.prototype.CreatorVerify = function(ID, mappingTable) {
//     this.creator = -1;
//     this.isCreatorVerified = -1;

//     if(mappingTable.account == null){
//         console.log("Mapping Table is not valid!");
//         return -1;
//     }
    
//     for(var i = 0; i < mappingTable.numOfAddress; i++){
//         if(mappingTable.account[i].creator_bit == 1 && mappingTable.account[i].address == ID){
//             this.creator = ID;
//             this.isCreatorVerified = 1;
//             return 1;
//         }
//     }

//     console.log("Creator error!");
//     return -1;
// }

// Creator.prototype.PoRT = function() {
//     var T = 1234;
//     T = T.toString();
//     var tmp = sha256(T + this.account[6].address);
//     var h = parseInt(tmp, 16) % T;
//     console.log(h);
// }

Creator.prototype.Create = function(pendingTxs, height, previousHash) {    
    for(var i = 0; i < pendingTxs.length; i++){
        this.MPT.UpdateValue(pendingTxs[i].sender, pendingTxs[i].receiver, pendingTxs[i].value);
    }

    this.block = new Block(height, pendingTxs.transactions, previousHash, this.MPT);

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

Creator.prototype.GetCosig = function(cosig) {
    this.block.coSignature = cosig;
}

Creator.prototype.GetBlock = function(previousHash) {
    var creatorPoRT = new PoRT(this.pubKey, this.MPT, 1);
    this.block.nextCreator = creatorPoRT.next_maintainer[1];
    for(var i = 0; i < this.VoterPubKey.length; i++){
        var voterPoRT = new PoRT(this.VoterPubKey[i], this.MPT, 2);
        this.block.nextVoters.push(voterPoRT.next_maintainer[1]);
    }
    this.block.hash = this.block.hashBlock(previousHash, this.block);
    return this.block;
}


module.exports = Creator;