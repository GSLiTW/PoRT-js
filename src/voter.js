const randomBytes = require('random-bytes');
const randomBuffer = (len) => Buffer.from(randomBytes.sync(len));
const BigInteger = require('bigi');
const schnorr = require('bip-schnorr');
const convert = schnorr.convert;
const muSig = schnorr.muSig;
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');

function Voter(port, pubKey, MPT){
    this.MPT = MPT;
    this.port = port;
    this.pubKey = pubKey;
    this.pubKeyCompressed = ec.keyFromPublic(this.pubKey, "hex").getPublic().encodeCompressed("hex")
}

Voter.prototype.IsValid = function() {
    return (this.MPT.Verify(this.pubKey) == 2);
}

Voter.prototype.CreatorUrl = function(url) {
    this.CreatorUrl = url;
}

Voter.prototype.VerifyBlock = function(merkleRoot, voterMPT) {
    var hash = voterMPT.Cal_hash();
    console.log("merkleRoot: ", merkleRoot);
    console.log("hash: ", hash);
    if(merkleRoot == hash){
        return 1;
    }
    else{
        return 0;
    }
}

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

Voter.prototype.GetSignerSession = function(SignerSession) {
    SignerSession.sessionId = Buffer.from(SignerSession.sessionId)
    SignerSession.ell = Buffer.from(SignerSession.ell)
    SignerSession.nonce = Buffer.from(SignerSession.nonce)
    SignerSession.commitment = Buffer.from(SignerSession.commitment)
    SignerSession.pubKeyCombined = Buffer.from(SignerSession.pubKeyCombined)
    SignerSession.message = Buffer.from(SignerSession.message)
    this.SignerSession = SignerSession;
}

Voter.prototype.ExchangeCommitment = function(commitments) {
    for(var i in commitments) {
        commitments[i] = Buffer.from(commitments[i])
    }
    this.publicData.commitments = commitments;
}

Voter.prototype.ExchangeNonce = function(nonces) {
    for(var i in nonces) {
        nonces[i] = Buffer.from(nonces[i])
    }
    this.publicData.nonces = nonces;
    
    this.publicData.nonceCombined = muSig.sessionNonceCombine(this.SignerSession, this.publicData.nonces);
    this.signerPrivateData.session.nonceIsNegated = this.SignerSession.nonceIsNegated;

    this.PartialSign();
}

Voter.prototype.PartialSign = function() {
    this.signerPrivateData.session.partialSignature = BigInteger.fromHex(muSig.partialSign(this.signerPrivateData.session, this.publicData.message, this.publicData.nonceCombined, this.publicData.pubKeyCombined).toHex());
}

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

Voter.prototype.CombinePartialSign = function() {
    this.publicData.signature = muSig.partialSigCombine(this.publicData.nonceCombined, this.publicData.partialSignatures);


    this.VerifyCoSig();
}

Voter.prototype.VerifyCoSig = function() {
    console.log("CoSig:", this.publicData.signature.toString('hex'))
    schnorr.verify(this.publicData.pubKeyCombined, this.publicData.message, this.publicData.signature);
    console.log("Voter", this.port, "- Verified :)")
}

Voter.prototype.PoRT = function() {
    var T = 1234;
    T = T.toString();
    var tmp = sha256(T + this.account[6].address);
    var h = parseInt(tmp, 16) % T;
    console.log(h);
}

module.exports = Voter;