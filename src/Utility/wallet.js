const sha256 = require('sha256');
const secureRandom = require('secure-random');
const elliptic = require('elliptic');
const ripemd160 = require('ripemd160');
const base58 = require('bs58');
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
  const signature = ecdsa.sign(dataHash, this.privateKey, 'hex', {canonical: true});
  return signature;
};
/**
 * Validate if the input address is valid
 * @param  {string} address - address to validate
 * @return {bool} True if the input address is valid; False otherwise
 */
Wallet.prototype.ValidateAddress = function(address) {
  let pubHash = base58.decode(address);
  const actualChecksum = pubHash.subarray(pubHash.length - CHECKSUM_LENGTH);
  const version = pubHash.subarray(0, 1);
  pubHash = pubHash.subarray(1, pubHash.length - CHECKSUM_LENGTH);
  const targetChecksum = this.Checksum(Buffer.concat([version, pubHash]));

  return (actualChecksum.compare(targetChecksum) == 0);
};

Wallet.prototype.getAddress = function(port) {
  const addressmap = new Map([
    [3000, '0x76f72b060b2f0a702f5fada34d005578f3b0e8f8'],
    [3001, '0x4ed4b2733f458f72979bea194ce8de5aa4889e0f'],
    [3002, '0xbb1f28e0f2b18c02c540903e5e4e30fcaa940578'],
    [3003, '0x2b1b3896ffa7627c6ec20d7b4ccfd2a2491fbd45'],
    [3004, '0x188ed5da756ab0c4fd2a0b7de157e256f6f93016'],
    [3005, '0xba0495e4ace004aae385a49b8b19020cbfa32e4e'],
    [3006, '0x7830b051f78fa364c4d7a9c0e911841d552deb83'],
    [3007, '0x214e6b62b61181f5a4a9931c36ada08115b6d734'],
    [3008, '0x0949b1b839b16f7fef08b1310673654ac370ad05'],
    [3009, '0x66c461ed5502a8e7d131b0cc974e2cb4f2e2d79c'],
    [3010, '0x304cc179719bc5b05418d6f7f6783abe45d83090'],
    [3011, '0x786775b2af02b7dc3e65aa09a141eaf422bfdf60'],
    [3012, '0x783306ef210dab06905f08ad3ff8955e4113368c'],
    [3013, '0xf1885c3894e896fcdbd6e4775a1f27ed4da97885'],
    [3014, '0x8cac691877b9b334d64e87b66fe990d304116cbd'],
    [3015, '0x6b05c54e7e93238273f0f7dd6ddeb86ea38f850a'],
    [3016, '0x763248b46c87bdaae87bdf78ed5583c07e9467ad'],
    [3017, '0x91959b10d2383ae24d55a634614436c77055257c'],
    [3018, '0x0dcfcda577514dc09e91f2e9525d5767e0c41db0'],
    [3019, '0xc1177f85711a49ea327874cd5b3c4eb523c47ca2'],
    [3020, '0xaa97288d8af06c1b05ce9417f6f94041a51fec3e'],
  ]);

  return addressmap.get(port);
};

Wallet.prototype.getPubKey = function(port) {
  const pubkeymap = new Map([
    [3000, '04f586957689dd425776cb9dabf6c8fa5b311a175ede33e1e85b54c931b6d8fb14f8085a1b095e6886a25bbe346da08eb05e605f100e67272da7dac4d4c43d60bc'],
    [3001, '04ddb66f61a02eb345d2c8da36fa269d8753c3a01863d28565f1c2cf4d4af8636fdd223365fd54c0040cb6401cfef4b1f2e3554ae9cc5de7a0fb9785a38aa724e8'],
    [3002, '04bfde01a8a6973c4ece805f9a46f83d076a00e310e37351b50ee9a619838ce19e6dca73814b3557845140d0e97850487277b5a7ba87f26bd0cf9d943ce7623b9b'],
    [3003, '040fb119adeaefa120c2cda25713da2523e36ebd0e0d5859bef2d96139583362d9f8420667557134c148405b5776102c633dfc3401a720eb5cdba05191fa371b7b'],
    [3004, '046fbf49bb8134c53d50595895283d4ce3b09473561219c6869ee2300af5481553e43d84d49837bd5a73fe6a3ab9337ef68532e1bf14ef83fb2d42eaa55c237680'],
    [3005, '04471e6c2ec29e66b89e816217d6f172959b60a2f13071cfeb698fdaed2e23e23b7693ed687088a736b8912f5cc81f3af46e6c486f64165e6818da2da713407f92'],
    [3006, '0482c4b01761ab85fcabebbb1021e032ac58c62d184a80a588e7ba6d01928cb0402bb174b6e7e9ce7528630bc9963bf7643320365ab88ee6500ad3eb2f91e0efcd'],
    [3007, '04665d86db1e1be975cca04ca255d11da51928b1d5c4e18d5f3163dbc62d6a5536fa4939ced9ae9faf9e1624db5c9f4d9d64da3a9af93b9896d3ea0c52b41c296d'],
    [3008, '0446a08e02df8950c6c5d1a1199747efab9fb5aadcdd79a95139f35bfbcf31f9ef8b116bad1012984521b6e7f07d1d8c67894d7d52880f894c93ff9c0aff439eb4'],
    [3009, '04cc4b7eec3629b6221be080110cc17decd6c0f9305ced1e587941f1fe5301ba4a5b3194b6db4e297580ec82cf8d5664a6057bf42873910664f259e0aede5731dc'],
    [3010, '0401d8c7ca7cb14196be6e39f9b14845b5e6144373d5721c05b1b269955d3861a7ecaa31ebff836770574c82497f00811f9d903f89e231bf61ca1bd961541db527'],
    [3011, '04670cc2d707fffe69f1ab5cd929c168f6cde7ee27b339d08e8e8d92e42ec9d471ff93509488e25493bdd041c2458e67b1b78e55db2a6f67c0602d7d32990176f6'],
    [3012, '04ede7370b728d35c23bf21bb9496131da34a481a6a64f76f0d6097799fa686b06ebb000176c8a2e92b8c6ae61a1eb7cbff806f778a38ff7f4ebc9569f39174a90'],
    [3013, '040111dbbb15166f16f77b5b16f31de91fa43a2399f8c940ccab922a121fe8cb0b428668851f8131ba0440e84507c6040e8fc1116555335725e1e954b2fe9cf52c'],
    [3014, '045bf028724efa0727c04cec7e718ebb27f6a080b88e4b942c77336a5adfccb96146ccd7b486e304df51a9ae0a453c52d5d119b418b52cb97b7fb848cd9efd6cea'],
    [3015, '043ba338b695e39d6ecb8ef5b4c16a0616f06f52f29a2068ead1f33274202b4c2798f0ef5be51f46df9f62e01f8d65a50a60ddbdf85b36607552626822a0f41921'],
    [3016, '04686044e26bbb146e1677d0a926f40244fd9991509ad04ffc1b8353d24c6fee96361ee9ab5905f69084e765c3f231be19bf9fa98afbfb69a2381e843662aeaea9'],
    [3017, '0444792068683712e11b2df2615d39cda8d7925e83e1914bf45bb2ccdfaf45e1de5300bb1eb9503a1be156505cf4f2e367f4178e95e12f89f31dbfc2a59e96fabb'],
    [3018, '04c56a992de87b3cd78a0ba7f03f2affcab71411c2781bb3d1debf719c7360915a0971fabf91378f213005c888b362d12358423d07cec8db32b381e670d1d5aa35'],
    [3019, '044f82d3ba2d746c443291a7f96da8bafaf08b1981059015d81ee55c71188d22762f7b08c5fef7ade325253b42c8466847ce2e978b4d9b44bf11c49b571ab4b8b4'],
    [3020, '040cbde1cdfef536018cfc4ed28c12a138a4bcc285d8e43cf4da6ac373ddd4bf30e36cb7b093f3cd3cae1aea2a32fa2d701602cb30e5e18e5b4021841b30245182'],
  ]);

  return pubkeymap.get(port);
};

module.exports = Wallet;
