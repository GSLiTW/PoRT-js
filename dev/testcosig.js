const randomBytes = require('random-bytes');
const randomBuffer = (len) => Buffer.from(randomBytes.sync(len));
const BigInteger = require('bigi');
const schnorr = require('bip-schnorr');
const convert = schnorr.convert;
const muSig = schnorr.muSig;
 
// data known to every participant
const publicData = {
  pubKeys: [
    Buffer.from('03bfde01a8a6973c4ece805f9a46f83d076a00e310e37351b50ee9a619838ce19e', 'hex'),
    Buffer.from('02ddb66f61a02eb345d2c8da36fa269d8753c3a01863d28565f1c2cf4d4af8636f', 'hex'),
    Buffer.from('030fb119adeaefa120c2cda25713da2523e36ebd0e0d5859bef2d96139583362d9', 'hex'),
  ],
  message: convert.hash(Buffer.from('muSig is awesome!', 'utf8')),
  pubKeyHash: null,
  pubKeyCombined: null,
  commitments: [],
  nonces: [],
  nonceCombined: null,
  partialSignatures: [],
  signature: null,
};
 
// data only known by the individual party, these values are never shared
// between the signers!
const signerPrivateData = [
  // signer 1
  {
    privateKey: BigInteger.fromHex('157938f922fa2b56d96c11b26b548583ee4ee15694f36d7c368a67833cd6e6d3'),
    session: null,
  },
  // signer 2
  {
    privateKey: BigInteger.fromHex('699a1202ba925fc647aaa21cf0a0d61e6dc1b5c5bc724d1f301dc78deba0ae0f'),
    session: null,
  },
  // signer 3
  {
    privateKey: BigInteger.fromHex('28657eace760ef1fa252617fe7f1c42701b52882b68844a8e63b41fbac2be300'),
    session: null,
  }
];
 
// -----------------------------------------------------------------------
// Step 1: Combine the public keys
// The public keys P_i are combined into the combined public key P.
// This can be done by every signer individually or by the initializing
// party and then be distributed to every participant.
// -----------------------------------------------------------------------
publicData.pubKeyHash = muSig.computeEll(publicData.pubKeys);
publicData.pubKeyCombined = muSig.pubKeyCombine(publicData.pubKeys, publicData.pubKeyHash);
 
// -----------------------------------------------------------------------
// Step 2: Create the private signing session
// Each signing party does this in private. The session ID *must* be
// unique for every call to sessionInitialize, otherwise it's trivial for
// an attacker to extract the secret key!
// -----------------------------------------------------------------------

signerPrivateData.forEach((data, idx) => {
  const sessionId = Buffer.randomBuffer(32); // must never be reused between sessions!
  data.session = muSig.sessionInitialize(
    sessionId,
    data.privateKey,
    publicData.message,
    publicData.pubKeyCombined,
    publicData.pubKeyHash,
    idx
  );
});
const signerSession = signerPrivateData[1].session;
 
// -----------------------------------------------------------------------
// Step 3: Exchange commitments (communication round 1)
// The signers now exchange the commitments H(R_i). This is simulated here
// by copying the values from the private data to public data array.
// -----------------------------------------------------------------------
for (let i = 0; i < publicData.pubKeys.length; i++) {
  publicData.commitments[i] = signerPrivateData[i].session.commitment;
}
 
// -----------------------------------------------------------------------
// Step 4: Get nonces (communication round 2)
// Now that everybody has commited to the session, the nonces (R_i) can be
// exchanged. Again, this is simulated by copying.
// -----------------------------------------------------------------------
for (let i = 0; i < publicData.pubKeys.length; i++) {
  publicData.nonces[i] = signerPrivateData[i].session.nonce;
}
 
// -----------------------------------------------------------------------
// Step 5: Combine nonces
// The nonces can now be combined into R. Each participant should do this
// and keep track of whether the nonce was negated or not. This is needed
// for the later steps.
// -----------------------------------------------------------------------
//console.log("~~~~~~~~~~~~~~signerSession: ", signerSession);
//console.log("~~~~~~~~~~~~~~publicData.nonces: ", publicData.nonces);
publicData.nonceCombined = muSig.sessionNonceCombine(signerSession, publicData.nonces);
//console.log("~~~~~~~~~~~~~~signerSession.nonceIsNegated: ", signerSession.nonceIsNegated);
signerPrivateData.forEach(data => (data.session.nonceIsNegated = signerSession.nonceIsNegated));

//signerPrivateData.forEach(data => (console.log("*******************data.session.nonceIsNegated: ", data.session.nonceIsNegated)));
 
// -----------------------------------------------------------------------
// Step 6: Generate partial signatures
// Every participant can now create their partial signature s_i over the
// given message.
// -----------------------------------------------------------------------
signerPrivateData.forEach(data => {
  console.log("%%%%%%%%%%%%%%", data.session, publicData.message, publicData.nonceCombined, publicData.pubKeyCombined)
  data.session.partialSignature = BigInteger.fromHex(muSig.partialSign(data.session, publicData.message, publicData.nonceCombined, publicData.pubKeyCombined).toHex());
  //console.log("~~~~~~~~~~data.session.partialSignature: ", data.session.partialSignature);
});
 
// -----------------------------------------------------------------------
// Step 7: Exchange partial signatures (communication round 3)
// The partial signature of each signer is exchanged with the other
// participants. Simulated here by copying.
// -----------------------------------------------------------------------
for (let i = 0; i < publicData.pubKeys.length; i++) {
  publicData.partialSignatures[i] = signerPrivateData[i].session.partialSignature;
}
 
// -----------------------------------------------------------------------
// Step 8: Verify individual partial signatures
// Every participant should verify the partial signatures received by the
// other participants.
// -----------------------------------------------------------------------
for (let i = 0; i < publicData.pubKeys.length; i++) {
  console.log("\n++++++++++++++++++++++++++++++++\n", signerSession, publicData.partialSignatures[i], publicData.nonceCombined, i, publicData.pubKeys[i], publicData.nonces[i]);

  muSig.partialSigVerify(
    signerSession,
    publicData.partialSignatures[i],
    publicData.nonceCombined,
    d[i],
    publicData.pubKeys[i],
    publicData.nonces[i]
  );
}
 
// -----------------------------------------------------------------------
// Step 9: Combine partial signatures
// Finally, the partial signatures can be combined into the full signature
// (s, R) that can be verified against combined public key P.
// -----------------------------------------------------------------------
publicData.signature = muSig.partialSigCombine(publicData.nonceCombined, publicData.partialSignatures);
//console.log("publicData.signature", publicData.signature);
 
// -----------------------------------------------------------------------
// Step 10: Verify signature
// The resulting signature can now be verified as a normal Schnorr
// signature (s, R) over the message m and public key P.
// -----------------------------------------------------------------------
schnorr.verify(publicData.pubKeyCombined, publicData.message, publicData.signature);