const Block = require("./block.js");
const PoRT = require("./PoRT.js");
/**
 * Generate & Initialize Creator Class
 * @param  {string} port - Network port number of the creator
 * @param  {string} pubKey - Wallet public key of the creator
 * @param  {MPT} MPT - Local Merkle Patricia Trie copy of the creator
 */
function Creator(port, pubKey, MPT) {
    this.MPT = MPT;
    this.port = port;
    this.pubKey = pubKey;
}
/**
 * Check if the caller is selected as creator to perform actions for the current round of block construction, by passing publickey into MPT function
 * @return {bool} True if the caller is the creator of the current round of block construction; False otherwise
 */
Creator.prototype.IsValid = function () {
    return (this.MPT.Verify(this.pubKey) == 1);
}
/**
 * Create a Block, adding transactions, MPT and metadata into it
 * @param  {list} pendingTxs
 * @param  {Number} height
 * @param  {string} previousHash
 * @return {Block} created block
 */
Creator.prototype.Create = function (pendingTxs, height, previousHash) {
    for (var i = 0; i < pendingTxs.length; i++) {
        this.MPT.UpdateValue(pendingTxs[i].sender, pendingTxs[i].receiver, pendingTxs[i].value);
    }

    this.block = new Block(height, pendingTxs.transactions, previousHash, this.MPT);

    return this.block;
}
/**
 * Get voter from network and add to the list
 * @param  {string} VoterUrl - Voter's network url
 * @param  {string} VoterPubKey - Wallet public key of voter
 */
Creator.prototype.GetVoter = function (VoterUrl, VoterPubKey) {
    if (this.VoterUrl == null) {
        this.VoterUrl = [VoterUrl];
        this.VoterPubKey = [VoterPubKey];
    } else {
        this.VoterUrl.push(VoterUrl);
        this.VoterPubKey.push(VoterPubKey);
    }
}
/**
 * Get signersession from network , generated voter
 * @param  {SignerSession} SignerSession - from network, generataed by voter
 */
Creator.prototype.GetSignerSession = function (SignerSession) {
    this.SignerSession = SignerSession;
}
/**
 * Store and Collect data(commitment) from voter through network (communication round 1) and to be sent back to voter through network <br>
 * (ref: https://bitcoindev.network/pure-javascript-implementation-of-the-schnorr-bip/)
 * @param  {} VoterCommitment 
 * @param  {string} VoterPubKey - Corresponding Voter's public key, from network
 */
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
/**
 * Store and Collect Nonce from voter through network (communication round 2) and to be sent back to voter through network <br>
 * (ref: https://bitcoindev.network/pure-javascript-implementation-of-the-schnorr-bip/)
 * @param  {Number} VoterNonce
 * @param  {string} VoterPubKey
 */
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
/**
 * Store and Collect PartialSign from voters through network (communication round 3) and to be sent back to voter through network <br>
 * (ref: https://bitcoindev.network/pure-javascript-implementation-of-the-schnorr-bip/)
 * @param  {string} VoterPartialSign
 * @param  {string} VoterPubKey
 */
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
/**
 * The final step of communication: store cosignature in the block
 * @param  {string} cosig - cosignature generated from voter.combinepartialsign
 */
Creator.prototype.GetCosig = function (cosig) {
    this.block.coSignature = cosig; 
}
/**
 * Complete the generation of current new block
 * @param  {string} previousHash - hash value of the last block
 * @return the completed new block
 */
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