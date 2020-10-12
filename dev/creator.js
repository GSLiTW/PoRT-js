const Block = require("./block.js");
const PoRT = require("./PoRT.js");
const randomBytes = require('random-bytes');
const randomBuffer = (len) => Buffer.from(randomBytes.sync(len));
const BigInteger = require("bigi");
const schnorr = require('bip-schnorr');
const convert = schnorr.convert;
const muSig = schnorr.muSig;

function Creator(mpt, pendingTxPool){
    this.MPT = mpt;
    this.pendingTxs = pendingTxPool.get_transaction();
    this.isNewMappingTableVoted = -1;
    this.nextCreator = -1;
    this.nextVoters = [];
    this.block = null;
    this.publicData;
}

/*Creator.prototype.CreatorVerify = function(ID, mappingTable) {
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
}*/

Creator.prototype.Create = function(height, previousHash) {
    this.isNewMappingTableVoted = -1;

    /*const creatorPoRT = new PoRT(address, this.MPT, this.pendingTxs, 1);
    this.nextCreator = creatorPoRT;
    this.nextVoters = nextVoters;*/

    this.block = new Block(height, this.pendingTxs, previousHash, this.MPT);

    for(var i = 0; i < this.pendingTxs.length; i++){
        this.MPT(this.pendingTxs[i].sender, this.pendingTxs[i].receiver, this.pendingTxs[i].value);
    }

    return this.block;
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

Creator.prototype.Cosig_createAndCombinePublicData = function(publicKey1, publicKey2, publicKey3, message) {
    // data known to every participant
    this.publicData = {
        pubKeys: [
          Buffer.from(publicKey1.toString(), 'hex'),
          Buffer.from(publicKey2.toString(), 'hex'),
          Buffer.from(publicKey3.toString(), 'hex')
        ],
        message: convert.hash(Buffer.from(message, 'utf8')),
        pubKeyHash: null,
        pubKeyCombined: null,
        commitments: [],
        nonces: [],
        nonceCombined: null,
        partialSignatures: [],
        signature: null,
      };
    
    // -----------------------------------------------------------------------
    // Step 1: Combine the public keys
    // The public keys P_i are combined into the combined public key P.
    // This can be done by every signer individually or by the initializing
    // party and then be distributed to every participant.
    // -----------------------------------------------------------------------
    this.publicData.pubKeyHash = muSig.computeEll(publicData.pubKeys);
    this.publicData.pubKeyCombined = muSig.pubKeyCombine(publicData.pubKeys, publicData.pubKeyHash);
}

Creator.prototype.Cosig_commitments = function(idx, signerCommmitment) {
    // -----------------------------------------------------------------------
    // Step 3: Exchange commitments (communication round 1)
    // The signers now exchange the commitments H(R_i). This is simulated here
    // by copying the values from the private data to public data array.
    // -----------------------------------------------------------------------
    this.publicData.comments[idx] = signerCommmitment;
}

Creator.prototype.Cosig_nonces = function(idx, signerNonce) {
    // -----------------------------------------------------------------------
    // Step 4: Get nonces (communication round 2)
    // Now that everybody has commited to the session, the nonces (R_i) can be
    // exchanged. Again, this is simulated by copying.
    // -----------------------------------------------------------------------
    this.publicData.nonces[idx] = signerNonce;
}

Creator.prototype.Cosig_combineNonces = function(combineNonces) {
    // -----------------------------------------------------------------------
    // Step 5: Combine nonces
    // The nonces can now be combined into R. Each participant should do this
    // and keep track of whether the nonce was negated or not. This is needed
    // for the later steps.
    // -----------------------------------------------------------------------
    this.publicData.nonceCombined = combineNonces;
}

Creator.prototype.Cosig_exchangePartialSignature = function(idx, signerPartialSignature) {
    // -----------------------------------------------------------------------
    // Step 7: Exchange partial signatures (communication round 3)
    // The partial signature of each signer is exchanged with the other
    // participants. Simulated here by copying.
    // -----------------------------------------------------------------------
    this.publicData.partialSignatures[idx] = signerPartialSignature;
}

Creator.prototype.Cosig_combinePartialSignatures = function() {
    // -----------------------------------------------------------------------
    // Step 9: Combine partial signatures
    // Finally, the partial signatures can be combined into the full signature
    // (s, R) that can be verified against combined public key P.
    // -----------------------------------------------------------------------
    this.publicData.signature = muSig.partialSigCombine(this.publicData.nonceCombined, this.publicData.partialSignatures);
}

Creator.prototype.Cosig_verifySignature = function() {
    // -----------------------------------------------------------------------
    // Step 10: Verify signature
    // The resulting signature can now be verified as a normal Schnorr
    // signature (s, R) over the message m and public key P.
    // -----------------------------------------------------------------------
    schnorr.verify(this.publicData.pubKeyCombined, this.publicData.message, this.publicData.signature);
}

module.exports = Creator;