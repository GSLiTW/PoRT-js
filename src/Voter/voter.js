/* eslint-disable max-len */
const randomBytes = require('random-bytes');
const randomBuffer = (len) => Buffer.from(randomBytes.sync(len));
const BigInteger = require('bigi');
const schnorr = require('bip-schnorr');
const convert = schnorr.convert;
const muSig = schnorr.muSig;
const elliptic = require('elliptic');
const Cosig = require('./cosig.js');
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
function Voter(port, wallet, MPT, blockchain) {
  this.MPT = MPT;
  this.port = port;
  this.wallet = wallet;
  const kp = wallet.NewKeyPair();
  this.secretv = kp[0];
  this.publicV = kp[1];
  this.blockchain = blockchain;
}
/**
 * Check if the caller is selected as voter to perform actions for the current round of block construction
 * @return {bool} True if the caller is the voter of the current round of block construction; False otherwise
 */
Voter.prototype.IsValid = function() {
  const roundOfVoter = this.MPT.Verify(this.wallet.publicKey.encode('hex'))[0]%2;
  const identityOfVoter = this.MPT.Verify(this.wallet.publicKey.encode('hex'))[1];
  const lastBlock = this.blockchain.getLastBlock();
  const roundNum = lastBlock.height%2;
  let checksum;
  if (roundNum == roundOfVoter && identityOfVoter == 2) {
    checksum = 1;
  } else {
    checksum = 0;
  }
  return checksum;
};
/**
 * Receive creator's network url from creator and save it in Voter's data structure
 * @param  {string} url - Creator's network url
 */
Voter.prototype.CreatorUrl = function(url) {
  this.CreatorUrl = url;
};

/**
 * Check if new block's merkle root is valid (matches the merkle root calculated by voter's local MPT copy)
 * @param  {string} merkleRoot - new block's merkle root calculated by creator
 * @param  {MPT} voterMPT - voter's local MPT copy
 * @return {bool} True if merkleRoot is valid; False otherwise
 */
/*
Voter.prototype.VerifyBlock = function(merkleRoot, voterMPT) { // TODO: why do we need to pass voter MPT?
  const hash = voterMPT.oldHash;
  console.log('merkleRoot: ', merkleRoot);
  console.log('hash: ', hash);

  if (merkleRoot == hash) {
    return 1;
  } else {
    return 0;
  }
};
*/
Voter.prototype.VerifyBlock = function (block_to_vote) {
  const txs = block_to_vote.transactions;
  let tx = null;
  let sender_value = null;


  for (let i = 0; i < txs.length; i++) {
      tx = txs[i];
      sender_value = this.MPT.Search(tx.sender);

      if (tx.value > sender_value) {
          return 0;
      }
      let hexToDecimal = (x) => ec.keyFromPrivate(x, "hex").getPrivate().toString(10);
      let pubKeyRecovered = ec.recoverPubKey(
          hexToDecimal(tx.id), tx.signature, tx.signature.recoveryParam, "hex");
      console.log("Recovered pubKey:", pubKeyRecovered.encodeCompressed("hex"));

      let validSig = ec.verify(tx.id, tx.signature, pubKeyRecovered);
      if (validSig == false) {
          return 0;
      }

  }
  return 1;
}
Voter.prototype.GenerateResponse = function(cHex) {
  this.cosig = new Cosig();
  this.response = this.cosig.GenerateResponse(cHex);

  return this.response;
};


module.exports = Voter;
