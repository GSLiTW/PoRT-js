const Block = require("./block.js");
const PoRT = require("./PoRT.js");
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const BN = require('bn.js');

/**
 * Generate & Initialize Creator Class
 * @class Creater is responsible for creating blocks and communicate with voter to generate cosignature
 * @param  {string} port - Network port number of the creator
 * @param  {string} pubKey - Wallet public key of the creator
 * @param  {MPT} MPT - Local Merkle Patricia Trie copy of the creator
 */
function Creator(port, wallet, MPT) {
    this.MPT = MPT;
    this.port = port;
    this.wallet = wallet;
}

/**
 * Check if the caller is selected as creator to perform actions for the current round of block construction, by passing publickey into MPT function
 * @return {bool} True if the caller is the creator of the current round of block construction; False otherwise
 */
Creator.prototype.IsValid = function () {
    return (this.MPT.Verify(this.wallet.publicKey.encode('hex')) == 1);
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
 * @param  {string} VoterPubV - Round public V of voter
 */
Creator.prototype.GetVoter = function (VoterUrl, VoterPubKey, VoterPubV) {
    if (this.VoterUrl == null) {
        this.VoterUrl = [VoterUrl];
        this.VoterPubKey = [VoterPubKey];
        this.VoterPubV = [VoterPubV]
    } else {
        this.VoterUrl.push(VoterUrl);
        this.VoterPubKey.push(VoterPubKey);
        this.VoterPubV.push(VoterPubV);
    }
}

Creator.prototype.GenerateChallenge = function() {
    V0_aggr = this.VoterPubV[0];
    for(var i = 1; i < this.VoterPubV.length; i++) {
        V0_aggr = V0_aggr.add(this.VoterPubV[i]);
    }

    hash.update(V0_aggr.encode('hex') + this.block);
    this.challenge = new BN(hash.copy().digest('hex'), 'hex');

    return this.challenge.toString('hex');
    
}

Creator.prototype.GetResponses = function (VoterResponseHex) {
    const VoterResponse = new BN(VoterResponseHex, 'hex');
    console.log(VoterResponse);
    if (this.VoterResponse == null) {
        this.VoterResponse = [VoterResponse];
    } else {
        this.VoterResponse.push(VoterResponse);
    }
}

Creator.prototype.AggregateResponse = function() {
    this.r0_aggr = this.VoterResponse[0];
    for(var i = 1; i < this.VoterResponse.length; i++) {
        this.r0_aggr = this.r0_aggr.add(this.VoterResponse[i]);
    }

    // TODO: Verify CoSig
    this.GetCoSig();
}

/**
 * The final step of communication: store cosignature in the block
 * @param  {string} cosig - cosignature generated from voter.combinepartialsign
 */
Creator.prototype.GetCoSig = function () {
    this.block.CoSig = {
        c: this.challenge,
        r0_aggr: this.r0_aggr
    }; 
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