const sha256 = require("sha256");
const secureRandom = require('secure-random');
const elliptic = require('elliptic');
const ripemd160 = require('ripemd160');
const base58 = require('bs58');

function Wallet() {
    this.balance = 0,
    this.privateKey = '',
    this.publicKey = '',
    this.NewKeyPair();
};

Wallet.prototype.NewKeyPair = function(){
    privateKey = secureRandom.randomBuffer(32);
    const ecdsa = new elliptic.ec('secp256k1');
    const keys = ecdsa.keyFromPrivate(privateKey);
    publicKey = keys.getPublic('hex');
}

Wallet.prototype.PublicKeyHash = function(){
    let hash = sha256(Buffer.from(this.publicKey, 'hex'));
    // console.log(hash)
    let publicKeyHash = new ripemd160().update(Buffer.from(hash, 'hex')).digest();
    // console.log(publicKeyHash.toString('hex'))
    return publicKeyHash.toString('hex');
}

Wallet.prototype.Checksum = function(versionedHash){
    var firstHash = sha256(Buffer.from(versionedHash, 'hex'));
    var secondHash = sha256(Buffer.from(firstHash, 'hex'));
    
    return secondHash.substring(0,8);

}

Wallet.prototype.Address = function() {
    var pubHash = this.PublicKeyHash();
    // console.log("PublicKeyHash: ", pubHash)
    var versionedHash = "00" + pubHash;
    // console.log("VersionedHash: ", versionedHash)
    var checksum = this.Checksum(versionedHash);
    // console.log("CHecksum: ", checksum);
    var fullHash = checksum + versionedHash;
    // console.log("FUllHash: ", fullHash)
    
    return base58.encode(Buffer.from(fullHash,'hex'));
}

Wallet.prototype.ValidateAddress = function(){

}

module.exports = Wallet;

w = new Wallet();
console.log(w.Address(), w.Address().length)