const elliptic = require('elliptic');
const Cosig = require('../cosig.js');
const ec = new elliptic.ec('secp256k1');
const cloneDeep = require('lodash.clonedeep');
/**
 * Constructor of the Voter class
 * @class Voter is used to generate cosignature for block creation
 * @constructor
 * @param  {string} port - Network port number of the voter
 * @param  {string} pubKey - Wallet public key of the voter
 * @param  {MPT} MPT - Local Merkle Patricia Trie copy of the voter
 */
function Voter(port, wallet, blockchain) {
  this.MPT = cloneDeep(blockchain.MPT);
  this.port = port;
  this.wallet = wallet;
  const kp = wallet.NewKeyPair();
  this.secretv = kp[0];
  this.publicV = kp[1];
  this.blockchain = cloneDeep(blockchain);
}
/**
 * Check if the caller is selected as voter to perform actions for the current round of block construction
 * @return {bool} True if the caller is the voter of the current round of block construction; False otherwise
 */
Voter.prototype.isValid = function() {
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
Voter.prototype.creatorUrl = function(url) {
  this.CreatorUrl = url;
};

/**
 * Check if new block's merkle root is valid (matches the merkle root calculated by voter's local MPT copy)
 * @param  {string} merkleRoot - new block's merkle root calculated by creator
 * @param  {MPT} voterMPT - voter's local MPT copy
 * @return {bool} True if merkleRoot is valid; False otherwise
 */

Voter.prototype.VerifyBlock = function(block_to_vote) {
  const txs = block_to_vote.transactions;
  let tx = null;
  let sender_value = null;


  for (let i = 0; i < txs.length; i++) {
    tx = txs[i];
    sender_value = this.MPT.Search(tx.sender).Balance();

    if (tx.value > sender_value) {
      return 0;
    }
    const hexToDecimal = (x) => ec.keyFromPrivate(x, 'hex').getPrivate().toString(10);
    const pubKeyRecovered = ec.recoverPubKey(
        hexToDecimal(tx.id.substr(2)), tx.sig, tx.sig.recoveryParam, 'hex');
    console.log('Recovered pubKey:', pubKeyRecovered.encodeCompressed('hex'));

    const validSig = ec.verify(tx.id.substr(2), tx.sig, pubKeyRecovered);
    if (validSig == false) {
      return 0;
    }
  }
  return 1;
};
Voter.prototype.GenerateResponse = function(cHex) {
  this.cosig = new Cosig();
  this.response = this.cosig.GenerateResponse(cHex, this.secretv, this.wallet.privateKey);

  return this.response;
};


module.exports = Voter;
