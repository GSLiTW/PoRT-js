const randomBytes = require('random-bytes');
const randomBuffer = (len) => Buffer.from(randomBytes.sync(len));
const BigInteger = require('bigi');
const schnorr = require('bip-schnorr');
const convert = schnorr.convert;
const muSig = schnorr.muSig;
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
const BN = require('bn.js');

/**
 * Constructor of the Voter class
 * @class Voter is used to generate cosignature for block creation
 * @constructor
 * @param  {string} port - Network port number of the voter
 * @param  {string} pubKey - Wallet public key of the voter
 * @param  {MPT} MPT - Local Merkle Patricia Trie copy of the voter
 */
function Voter(port, wallet, MPT){
    this.MPT = MPT;
    this.port = port;
    this.wallet = wallet;
    var kp = wallet.NewKeyPair();
    this.secretv = kp[0];
    this.publicV = kp[1];
}
/**
 * Check if the caller is selected as voter to perform actions for the current round of block construction
 * @return {bool} True if the caller is the voter of the current round of block construction; False otherwise 
 */
Voter.prototype.IsValid = function() {
    return (this.MPT.Verify(this.wallet.publicKey.encode('hex')) == 2); // Check by validating the dirty bit in the latest account MPT
}
/**
 * Receive creator's network url from creator and save it in Voter's data structure
 * @param  {string} url - Creator's network url
 */
Voter.prototype.CreatorUrl = function(url) {
    this.CreatorUrl = url;
}
/**
 * Check if new block's merkle root is valid (matches the merkle root calculated by voter's local MPT copy)
 * @param  {string} merkleRoot - new block's merkle root calculated by creator
 * @param  {MPT} voterMPT - voter's local MPT copy
 * @return {bool} True if merkleRoot is valid; False otherwise 
 */
Voter.prototype.VerifyBlock = function(merkleRoot, voterMPT) {  // TODO: why do we need to pass voter MPT?
    var hash = voterMPT.oldHash;
    console.log("merkleRoot: ", merkleRoot);
    console.log("hash: ", hash);

    if(merkleRoot == hash){
        return 1;
    }
    else{
        return 0;
    }
}

Voter.prototype.GenerateResponse = function(cHex) {
    const c = new BN(cHex, 'hex');
    const v = new BN(this.secretv.toString('hex'), 'hex');
    const x = new BN(this.wallet.privateKey.toString('hex'), 'hex');
    this.response = v.sub(c.mul(x));

    return this.response.toString('hex');
}


module.exports = Voter;