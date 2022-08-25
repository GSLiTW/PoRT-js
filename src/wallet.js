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

Wallet.prototype.getAddress = function(port) {
  let addressmap = new Map([
    [3000, "0x76f72b060b2f0a702f5fada34d005578f3b0e8f8"],
    [3001, "0x4ed4b2733f458f72979bea194ce8de5aa4889e0f"],
    [3002, "0xbb1f28e0f2b18c02c540903e5e4e30fcaa940578"],
    [3003, "0x2b1b3896ffa7627c6ec20d7b4ccfd2a2491fbd45"],
    [3004, "0x188ed5da756ab0c4fd2a0b7de157e256f6f93016"],
    [3005, "0xba0495e4ace004aae385a49b8b19020cbfa32e4e"],
    [3006, "0x7830b051f78fa364c4d7a9c0e911841d552deb83"],
    [3007, "0x214e6b62b61181f5a4a9931c36ada08115b6d734"],
    [3008, "0x0949b1b839b16f7fef08b1310673654ac370ad05"],
    [3009, "0x66c461ed5502a8e7d131b0cc974e2cb4f2e2d79c"],
    [3010, "0x304cc179719bc5b05418d6f7f6783abe45d83090"],
    [3011, "0x786775b2af02b7dc3e65aa09a141eaf422bfdf60"],
    [3012, "0x783306ef210dab06905f08ad3ff8955e4113368c"],
    [3013, "0xf1885c3894e896fcdbd6e4775a1f27ed4da97885"],
    [3014, "0x8cac691877b9b334d64e87b66fe990d304116cbd"],
    [3015, "0x6b05c54e7e93238273f0f7dd6ddeb86ea38f850a"],
    [3016, "0x763248b46c87bdaae87bdf78ed5583c07e9467ad"],
    [3017, "0x91959b10d2383ae24d55a634614436c77055257c"],
    [3018, "0x0dcfcda577514dc09e91f2e9525d5767e0c41db0"],
    [3019, "0xc1177f85711a49ea327874cd5b3c4eb523c47ca2"],
    [3020, "0xaa97288d8af06c1b05ce9417f6f94041a51fec3e"],
  ]);

  return addressmap(port);
}

module.exports = Wallet;
