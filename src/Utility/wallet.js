const sha256 = require('sha256');
const secureRandom = require('secure-random');
const elliptic = require('elliptic');
const ripemd160 = require('ripemd160');
const base58 = require('bs58');
const BigInteger = require('bigi');
const ecdsa = new elliptic.ec('secp256k1');

const CHECKSUM_LENGTH = 4; // 4 bytes
/**
 * Generate & Initialize Wallet Class
 * @class Wallet Class contains public-private key pair as well as its signing function for a wallet node
 * @constructor
 * @param  {string} [prik] - private key
 * @param  {string} [pubk] - public key
 */
function Wallet(prik='', pubk='') {
  if (prik == '' || pubk == '') {
    const keypair = this.NewKeyPair();
    this.privateKey = keypair[0];
    this.publicKey = keypair[1];
  } else {
    const keys = ecdsa.keyFromPrivate(prik);
    this.privateKey = keys.getPrivate();
    this.publicKey = keys.getPublic();
  }
};
/**
 * Generate key pair when no parameters passed into wallet constructor
 */
Wallet.prototype.NewKeyPair = function(privateKey=secureRandom.randomBuffer(32)) {
  // var privateKey = secureRandom.randomBuffer(32);

  const keys = ecdsa.keyFromPrivate(privateKey);
  // var publicKey = keys.getPublic();
  return [keys.getPrivate(), keys.getPublic()];
};

Wallet.prototype.PublicKeyFromHex = function(hex) {
  return ecdsa.keyFromPublic(hex, 'hex').getPublic();
};

/**
 * Generate the hash of public key
 * @return {string}  public key hash
 */
Wallet.prototype.PublicKeyHash = function() {
  const hash = sha256(Buffer.from(publicKey, 'hex'));

  const publicKeyHash = new ripemd160().update(Buffer.from(hash, 'hex')).digest();

  return publicKeyHash.toString('hex');
};
/**
 * Hash twice to generate checksum
 * @param  {string} versionedHash - bitcoin blockchain version byte + publickey hash
 * @return {string} checksum for address conversion
 */
Wallet.prototype.Checksum = function(versionedHash) {
  const firstHash = sha256(Buffer.from(versionedHash, 'hex'));
  let secondHash = sha256(Buffer.from(firstHash, 'hex'));
  secondHash = Buffer.from(secondHash, 'hex');
  return secondHash.subarray(0, CHECKSUM_LENGTH);
};
/**
 * Generate address from initial public key
 * @return {string}  base58 address
 */
Wallet.prototype.Address = function() {
  const pubHash = this.PublicKeyHash();
  const versionedHash = '00' + pubHash;
  const checksum = this.Checksum(versionedHash);
  const fullHash = versionedHash + checksum.toString('hex');

  return base58.encode(Buffer.from(fullHash, 'hex'));
};
/**
 * Sign data for multisignature
 * @param  {string} dataHash - data to sign
 * @return {string} signature
 */
Wallet.prototype.Sign = function(dataHash) {
  const ecdsa = new elliptic.ec('secp256k1');
  const signature = ecdsa.sign(dataHash, privateKey, 'hex', {canonical: true});
  return signature;
};
/**
 * Validate if the input address is valid
 * @param  {string} address - address to validate
 * @return {bool} True if the input address is valid; False otherwise
 */
Wallet.prototype.ValidateAddress = function(address) {
  var pubHash = base58.decode(address);
  const actualChecksum = pubHash.subarray(pubHash.length - CHECKSUM_LENGTH);
  const version = pubHash.subarray(0, 1);
  var pubHash = pubHash.subarray(1, pubHash.length - CHECKSUM_LENGTH);
  const targetChecksum = this.Checksum(Buffer.concat([version, pubHash]));

  return (actualChecksum.compare(targetChecksum) == 0);
};

module.exports = Wallet;
