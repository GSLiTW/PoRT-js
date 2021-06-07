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
    var hash = voterMPT.Cal_hash();
    // console.log("merkleRoot: ", merkleRoot);
    // console.log("hash: ", hash);
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

/**
 * Get the publicly known data for multisig from creator and store them in Voter's data structure
 * (ref: https://bitcoindev.network/pure-javascript-implementation-of-the-schnorr-bip/)
 * @param  {Array[string]} pubKeys - wallet public keys of other voters
 * @param  {*} message - shared message between creator/voter
 */
Voter.prototype.GetPublicData = function(pubKeys, message) {
    this.pubKeys = pubKeys.slice();
    for(var i in pubKeys) {
        pubKeys[i] = Buffer.from(pubKeys[i], 'hex');
    }
    message = convert.hash(Buffer.from(JSON.stringify(message), 'utf8'));
    this.publicData = {
        pubKeys: pubKeys,
        message: message,
        pubKeyHash: null,
        pubKeyCombined: null,
        commitments: [],
        nonces: [],
        nonceCombined: null,
        partialSignatures: [],
        signature: null,
    }
    // console.log(this.publicData);

    this.publicData.pubKeyHash = muSig.computeEll(this.publicData.pubKeys);
    this.publicData.pubKeyCombined = muSig.pubKeyCombine(this.publicData.pubKeys, this.publicData.pubKeyHash);
}
/**
 * Create the private signing session for multisig <br>
 * (ref: https://bitcoindev.network/pure-javascript-implementation-of-the-schnorr-bip/)
 * @param  signerPrivateData
 * @return SignerSession if it is the first voter (idx == 0); null otherwise
 */
Voter.prototype.PrivateSign = function(signerPrivateData) {
    this.signerPrivateData = signerPrivateData;
    const idx = this.pubKeys.indexOf(this.pubKeyCompressed);
    const sessionId = randomBuffer(32); // must never be reused between sessions!
    this.signerPrivateData.session = muSig.sessionInitialize(
        sessionId,
        this.signerPrivateData.privateKey,
        this.publicData.message,
        this.publicData.pubKeyCombined,
        this.publicData.pubKeyHash,
        idx
    );


    if(idx == 0) {
        this.SignerSession = JSON.parse(JSON.stringify(this.signerPrivateData.session));
        this.SignerSession.secretKey = null;
        this.SignerSession.secretNonce = null;
        return this.SignerSession;
    } else {
        return null;
    }
}

/**
 * Get SignerSession from the first voter and store it in each voter's SignerSession <br>
 * (ref: https://bitcoindev.network/pure-javascript-implementation-of-the-schnorr-bip/)
 * @param  {SignerSession} SignerSession - first voter's signer session
 */
Voter.prototype.GetSignerSession = function(SignerSession) {
    SignerSession.sessionId = Buffer.from(SignerSession.sessionId)
    SignerSession.ell = Buffer.from(SignerSession.ell)
    SignerSession.nonce = Buffer.from(SignerSession.nonce)
    SignerSession.commitment = Buffer.from(SignerSession.commitment)
    SignerSession.pubKeyCombined = Buffer.from(SignerSession.pubKeyCombined)
    SignerSession.message = Buffer.from(SignerSession.message)
    this.SignerSession = SignerSession;
}

/**
 * Exchange each voter's commitment (communication round 1) through creator <br>
 * (ref: https://bitcoindev.network/pure-javascript-implementation-of-the-schnorr-bip/)
 * @param  {} commitments
 */
Voter.prototype.ExchangeCommitment = function(commitments) {
    for(var i in commitments) {
        commitments[i] = Buffer.from(commitments[i])
    }
    this.publicData.commitments = commitments;
}
/**
 * Get nonces from each voter (communication round 2) through creator <br>
 * (ref: https://bitcoindev.network/pure-javascript-implementation-of-the-schnorr-bip/)
 * @param  {Array} nonces
 */
Voter.prototype.ExchangeNonce = function(nonces) {
    for(var i in nonces) {
        nonces[i] = Buffer.from(nonces[i])
    }
    this.publicData.nonces = nonces;
    
    this.publicData.nonceCombined = muSig.sessionNonceCombine(this.SignerSession, this.publicData.nonces);
    this.signerPrivateData.session.nonceIsNegated = this.SignerSession.nonceIsNegated;

    this.PartialSign();
}
/**
 * Generate partial signatures over the given message <br>
 * (ref: https://bitcoindev.network/pure-javascript-implementation-of-the-schnorr-bip/)
 */
Voter.prototype.PartialSign = function() {
    this.signerPrivateData.session.partialSignature = BigInteger.fromHex(muSig.partialSign(this.signerPrivateData.session, this.publicData.message, this.publicData.nonceCombined, this.publicData.pubKeyCombined).toHex());
}
/**
 * Exchange voter's partial signatures (communication round 3) through creator <br>
 * (ref: https://bitcoindev.network/pure-javascript-implementation-of-the-schnorr-bip/)
 * @param  {Array} partialsigns
 */
Voter.prototype.ExchangePartialSign = function(partialsigns) { 
    for(var i in partialsigns) {
        partialsigns[i] = BigInteger.fromHex(partialsigns[i])
    }
    this.publicData.partialSignatures = partialsigns;


    for (let i = 0; i < this.publicData.pubKeys.length; i++) {

        muSig.partialSigVerify(
          this.SignerSession,
          this.publicData.partialSignatures[i],
          this.publicData.nonceCombined,
          i,
          this.publicData.pubKeys[i],
          this.publicData.nonces[i]
        );
    }

    this.CombinePartialSign();
}
/**
 * Combine partial signatures to full signature (s, R) that can be verified against combined public key P
 * ,then verify as Schnorr signature (s, R) over the message m and public key P. <br>
 * (ref: https://bitcoindev.network/pure-javascript-implementation-of-the-schnorr-bip/)
 */
Voter.prototype.CombinePartialSign = function() {
    this.publicData.signature = muSig.partialSigCombine(this.publicData.nonceCombined, this.publicData.partialSignatures);
    this.VerifyCoSig();
}
/**
 * Verify the signature as a normal Schnorr Signature (s, R) over message m and public key P <br>
 * (ref: https://bitcoindev.network/pure-javascript-implementation-of-the-schnorr-bip/)
 */
Voter.prototype.VerifyCoSig = function() {
    console.log("CoSig:", this.publicData.signature.toString('hex'))
    schnorr.verify(this.publicData.pubKeyCombined, this.publicData.message, this.publicData.signature);
    console.log("Voter", this.port, "- Verified :)")
}




module.exports = Voter;