/* 
 * CAUTION: NOT YET DEBUGGED
 */
var crypto = require("crypto");
var eol = require('os').EOL;

const PoRT = require("./PoRT.js");

const randomBytes = require('random-bytes');
const randomBuffer = (len) => Buffer.from(randomBytes.sync(len));
const BigInteger = require("bigi");
const schnorr = require('bip-schnorr');
const convert = schnorr.convert;
const muSig = schnorr.muSig;

//get voter's wallet and sign a signature
/*function RSASign(privateKey, data) {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    var sig = sign.sign(privateKey, 'hex')
    console.log(sig);
    return sig;
}

function RSAVerify(publicKey, signature, data) {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(data);
    console.log(verify.verify(publicKey, signature,'hex'));
}

var dataToSign = "some data";
var sig = RSASign(privateKey, dataToSign);
RSAVerify(publicKey, sig, dataToSign);

var pubStr = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCbbBSVpWzSmCGVeezhuVFgUEYowUxgX/SnFdymGRCHGc77d5I0xkMAnIOWbI2MmP8j/7sdfPuUF0V5zw+Hd/7iZ6vs2k4JRKdprrB/zSC4GGqCDpDkbRYydcw3kwDgKkHhDp6NwIKvvl87WsnFozi487tGPQ8NO15hngwsV7DrawIDAQAB';
var publickKey = '-----BEGIN PUBLIC KEY-----' + eol + pubStr + eol + '-----END PUBLIC KEY-----';

var p = 'MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAJtsFJWlbNKYIZV57OG5UWBQRijBTGBf9KcV3KYZEIcZzvt3kjTGQwCcg5ZsjYyY/yP/ux18+5QXRXnPD4d3/uJnq+zaTglEp2musH/NILgYaoIOkORtFjJ1zDeTAOAqQeEOno3Agq++XztaycWjOLjzu0Y9Dw07XmGeDCxXsOtrAgMBAAECgYAV13iFFzxV1B9UHFBX4G05Nc7GR3PuT03YdVAO35LdCZl26XTYicw8t8IeT58M1St16ahoGnpYc3TGC31JMmnVOr58At0jbd4JQgvUaE+2jVvgp0Lc6n/jN+7NYBGlEy44ZpIRbB1Biu7khCZ0D+8PZsDMi6WJK4jgI5Gf/aXvkQJBAOe6809U/1wEVDJFHZ6A++WI/8iebXSbw9hDa4a9qoXv8bsMjYkDiblD3UPRlTEdFsAOA/YuGdah+fKE7jKdKkcCQQCrszD8Z1MYWYE4dMQTRPxEKHGQZd5HHkTQu9l6FV7Bv2ga9wLhT4QTb/5U7WYGgbfxhFzklxoqsmhTJNuLlyO9AkBrA1nDZBQ9MT6UrHheL2Ckgpzkz8zqUdiicZghdEtgaQtv/v8JrBmY9e8jl5DXSoCsFozbzjReexTLW3oI462XAkEAnTQ/kZl4tz6b1XjzXUE4R59P+wmJ7kuEbijQAbs3OuVpB+dJN8l5/+H2VwPU+fgi1np+Ir1GM/mNEzMX4ELNcQJBAIk1s3Y7ep2gK0p4js4f9HU0u2vH25+6bu+y6JFfvIBd8OR1bCFEe3FIui1H/ohh0Eoo3ZgJZ/5JjwfsqJzOoBs=';
var privateKey = '-----BEGIN PRIVATE KEY-----' + eol + p + eol + '-----END PRIVATE KEY-----'
*/

const sha256 = require("sha256");

function Voter(mpt, /*newBlock,*/ TxPool) {
    this.MPT = mpt;
    /*this.newBlock = newBlock;*/
    this.TxPool = TxPool.get_transaction();
}

/*Voter.prototype.Verify = function() {
    //console.log(this.GlobalMPT.numOfAddress);
    if(1) {
        for(var i = 0; i < this.GlobalMPT.numOfAddress; i++) {
            
            if(this.GlobalMPT.account[i].address == this.ID) {
                
                if(this.GlobalMPT.account[i].voter_bit = 1) {
                    this.IsVoter = 1;
                } else {
                    this.IsVoter = 0;
                    break;
                }
            }
        }
    }
    
    if(this.IsVoter == undefined) {
        console.log("Error: ID does not match to MPT!\n");
    }
}*/


Voter.prototype.Cosig_setSignerPrivateData = function(signerPrivateData, portNumber, publicData) {
    // -----------------------------------------------------------------------
    // Step 2: Create the private signing session
    // Each signing party does this in private. The session ID *must* be
    // unique for every call to sessionInitialize, otherwise it's trivial for
    // an attacker to extract the secret key!
    // -----------------------------------------------------------------------
    const sessionId = randomBuffer(32); // must never be reused between sessions!
    const idx = portNumber % 3000;
    signerPrivateData.session = muSig.sessionInitialize(
            sessionId,
            signerPrivateData.privateKey,
            publicData.message,
            publicData.pubKeyCombined,
            publicData.pubKeyHash,
            idx
    );
    //const signerSession = signerPrivateData.session;      //network: if(idx == 0) do this!

    return signerPrivateData;
}

Voter.prototype.Cosig_commitment = function(signerPrivateData) {
    // -----------------------------------------------------------------------
    // Step 3: Exchange commitments (communication round 1)
    // The signers now exchange the commitments H(R_i). This is simulated here
    // by copying the values from the private data to public data array.
    // -----------------------------------------------------------------------
        
    return signerPrivateData.session.commitment;
}

Voter.prototype.Cosig_nonce = function(signerPrivateData) {
    // -----------------------------------------------------------------------
    // Step 4: Get nonces (communication round 2)
    // Now that everybody has commited to the session, the nonces (R_i) can be
    // exchanged. Again, this is simulated by copying.
    // ----------------------------------------------------------------------- 
    
    return signerPrivateData.session.nonce;
}

Voter.prototype.Cosig_combineNonces_check = function(signerSession, publicData) {
    // -----------------------------------------------------------------------
    // Step 5: Combine nonces
    // The nonces can now be combined into R. Each participant should do this
    // and keep track of whether the nonce was negated or not. This is needed
    // for the later steps.
    // -----------------------------------------------------------------------

    return muSig.sessionNonceCombine(signerSession, publicData.nonces);
}

Voter.prototype.Cosig_combineNonces_combine = function(signerPrivateData, signerNonceIsNegated) {
    // -----------------------------------------------------------------------
    // Step 5: Combine nonces
    // The nonces can now be combined into R. Each participant should do this
    // and keep track of whether the nonce was negated or not. This is needed
    // for the later steps.
    // -----------------------------------------------------------------------
    signerPrivateData.session.nonceIsNegated = signerNonceIsNegated;

    return signerPrivateData;
}

Voter.prototype.Cosig_generatePartialSignature = function(signerPrivateData, publicData) {
    // -----------------------------------------------------------------------
    // Step 6: Generate partial signatures
    // Every participant can now create their partial signature s_i over the
    // given message.
    // -----------------------------------------------------------------------
    signerPrivateData.session.partialSignature = muSig.partialSign(data.session, publicData.message, publicData.nonceCombined, publicData.pubKeyCombined);

    return signerPrivateData;
}

Voter.prototype.Cosig_exchangePartialSignature = function(signerPrivateData) {
    // -----------------------------------------------------------------------
    // Step 7: Exchange partial signatures (communication round 3)
    // The partial signature of each signer is exchanged with the other
    // participants. Simulated here by copying.
    // -----------------------------------------------------------------------

    return signerPrivateData.session.partialSignature;;
}

Voter.prototype.Cosig_verifyIndividualPartialSignatures = function(signerSession, publicData) {
    // -----------------------------------------------------------------------
    // Step 8: Verify individual partial signatures
    // Every participant should verify the partial signatures received by the
    // other participants.
    // -----------------------------------------------------------------------
    for (let i = 0; i < publicData.pubKeys.length; i++) {
        muSig.partialSigVerify(
            signerSession,
            publicData.partialSignatures[i],
            publicData.nonceCombined,
            i,
            publicData.pubKeys[i],
            publicData.nonces[i]
        );
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

    if(this.CreatorMPT.numOfAddress != this.GlobalMPT.numOfAddress) {
        return false;
    }

    for(var i = 0; i < this.GlobalMPT.numOfAddress; i++) {
        if(this.GlobalMPT.account[i].balance != this.CreatorMPT.account[i].balance) {
            return false;
        }
    }

    for(var i = 0; i < this.TxPool.length; i++){
        for(var j = 0; j < this.CreatorMPT.numOfAddress; j++){
            if(this.TxPool[i].sender == this.CreatorMPT.account[j].address){
                var find = false;
                for(var tx = 0; tx < this.CreatorMPT.account[j].transactions.length; tx++) {
                    if(this.CreatorMPT.account[j].transactions[tx] == this.TxPool[i]) {
                        find = true;
                    }
                }
                if(find == false) {
                    return false;
                }
            }
            
            if(this.TxPool[i].receiver == this.CreatorMPT.account[j].address){
                var find = false;
                for(var tx = 0; tx < this.CreatorMPT.account[j].transactions.length; tx++) {
                    if(this.CreatorMPT.account[j].transactions[tx] == this.TxPool[i]) {
                        find = true;
                    }
                }
                if(find == false) {
                    return false;
                }
            }
        }        
    }

    return true;
}

/*Voter.prototype.PoRT = function() {
    const voterPoRT = new PoRT(address, this.MPT, this.pendingTxs, 1);
    this.nextVoter = voterPoRT;
}*/

module.exports = Voter;