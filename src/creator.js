const Block = require("./block.js");
const PoRT = require("./PoRT.js");

function Creator(port, pubKey, MPT) {
    this.MPT = MPT;
    this.port = port;
    this.pubKey = pubKey;
}

Creator.prototype.IsValid = function () {
    return (this.MPT.Verify(this.pubKey) == 1);
}

Creator.prototype.Create = function (pendingTxs, height, previousHash) {
    for (var i = 0; i < pendingTxs.length; i++) {
        this.MPT.UpdateValue(pendingTxs[i].sender, pendingTxs[i].receiver, pendingTxs[i].value);
    }

    this.block = new Block(height, pendingTxs.transactions, previousHash, this.MPT);

    return this.block;
}

Creator.prototype.GetVoter = function (VoterUrl, VoterPubKey) {
    if (this.VoterUrl == null) {
        this.VoterUrl = [VoterUrl];
        this.VoterPubKey = [VoterPubKey];
    } else {
        this.VoterUrl.push(VoterUrl);
        this.VoterPubKey.push(VoterPubKey);
    }
}

Creator.prototype.GetSignerSession = function (SignerSession) {
    this.SignerSession = SignerSession;
}

Creator.prototype.GetCommitments = function (VoterCommitment, VoterPubKey) {
    var idx = this.VoterPubKey.indexOf(VoterPubKey);
    if (this.commitments == null) {
        this.commitments = []
        for (var i = 0; i < this.VoterPubKey.length; i++) {
            this.commitments.push(null);
        }
    }

    this.commitments[idx] = VoterCommitment;
    for (var i in this.commitments) {
        if (this.commitments[i] == null) {
            return false;
        }
    }

    return true;
}

Creator.prototype.GetNonces = function (VoterNonce, VoterPubKey) {
    var idx = this.VoterPubKey.indexOf(VoterPubKey);
    if (this.nonces == null) {
        this.nonces = []
        for (var i = 0; i < this.VoterPubKey.length; i++) {
            this.nonces.push(null);
        }
    }

    this.nonces[idx] = VoterNonce;
    for (var i in this.nonces) {
        if (this.nonces[i] == null) {
            return false;
        }
    }

    return true;
}

Creator.prototype.GetPartialSigns = function (VoterPartialSign, VoterPubKey) {
    var idx = this.VoterPubKey.indexOf(VoterPubKey);
    if (this.partialsigns == null) {
        this.partialsigns = []
        for (var i = 0; i < this.VoterPubKey.length; i++) {
            this.partialsigns.push(null);
        }
    }

    this.partialsigns[idx] = VoterPartialSign;
    for (var i in this.partialsigns) {
        if (this.partialsigns[i] == null) {
            return false;
        }
    }

    return true;
}

Creator.prototype.GetCosig = function (cosig) {
    this.block.coSignature = cosig;
}

Creator.prototype.GetBlock = function (previousHash) {
    var creatorPoRT = new PoRT(this.pubKey, this.MPT, 1);
    this.block.nextCreator = creatorPoRT.next_maintainer[1];
    for (var i = 0; i < this.VoterPubKey.length; i++) {
        var voterPoRT = new PoRT(this.VoterPubKey[i], this.MPT, 2);
        this.block.nextVoters.push(voterPoRT.next_maintainer[1]);
    }
    this.block.hash = this.block.hashBlock(previousHash, this.block);
    return this.block;
}


module.exports = Creator;