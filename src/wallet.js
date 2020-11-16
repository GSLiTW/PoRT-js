const sha256 = require("sha256");
const secureRandom = require('secure-random');
const elliptic = require('elliptic');
const ripemd160 = require('ripemd160');
const base58 = require('bs58');
const BigInteger = require("bigi");
const ec = new elliptic.ec('secp256k1');

const CHECKSUM_LENGTH = 4; // 4 bytes

function Wallet(prik='', pubk='') {
    this.privateKey = prik;
    this.publicKey = pubk;

    if(prik == '' || pubk == ''){
        this.NewKeyPair();
    }

    this.signerPrivateData = {
        privateKey:BigInteger.fromHex(this.privateKey),
        session: null
    };
    this.publicKeyCompressed = ec.keyFromPublic(this.publicKey, "hex").getPublic().encodeCompressed("hex")
};

Wallet.prototype.NewKeyPair = function(){
    this.privateKey = secureRandom.randomBuffer(32);
    this.signerPrivateData.privateKey = BigInteger.fromBuffer(this.privateKey);
    const ecdsa = new elliptic.ec('secp256k1');
    const keys = ecdsa.keyFromPrivate(this.privateKey);
    this.publicKey = keys.getPublic('hex');     //integer
}

Wallet.prototype.PublicKeyHash = function(){
    let hash = sha256(Buffer.from(publicKey, 'hex'));

    let publicKeyHash = new ripemd160().update(Buffer.from(hash, 'hex')).digest();

    return publicKeyHash.toString('hex');
}

Wallet.prototype.Checksum = function(versionedHash){
    var firstHash = sha256(Buffer.from(versionedHash, 'hex'));
    var secondHash = sha256(Buffer.from(firstHash, 'hex'));
    secondHash = Buffer.from(secondHash, 'hex');
    return secondHash.subarray(0,CHECKSUM_LENGTH);

}

Wallet.prototype.Address = function() {
    var pubHash = this.PublicKeyHash();
    var versionedHash = "00" + pubHash;
    var checksum = this.Checksum(versionedHash);
    var fullHash = versionedHash + checksum.toString('hex');
    
    return base58.encode(Buffer.from(fullHash,'hex'));
}

Wallet.prototype.Sign = function(dataHash) {
    const ecdsa = new elliptic.ec('secp256k1');
    let signature = ecdsa.sign(dataHash, privateKey, "hex", {canonical:true});
    return signature;
}

Wallet.prototype.ValidateAddress = function(address){
    var pubHash = base58.decode(address);
    var actualChecksum = pubHash.subarray(pubHash.length - CHECKSUM_LENGTH);
    var version = pubHash.subarray(0,1);
    var pubHash = pubHash.subarray(1,pubHash.length - CHECKSUM_LENGTH);
    var targetChecksum = this.Checksum(Buffer.concat([version, pubHash]));

    return (actualChecksum.compare(targetChecksum) == 0)

}

module.exports = Wallet;
