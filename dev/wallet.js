const sha256 = require("sha256");
const secureRandom = require('secure-random');
const elliptic = require('elliptic');
const ripemd160 = require('ripemd160');

function Wallet(){
    this.privateKey = '';
    this.publicKey = '';
}

Wallet.prototype.NewKeyPair = function(){
    privateKey = secureRandom.randomBuffer(32);
    const ecdsa = new elliptic.ec('secp256k1');
    const keys = ecdsa.keyFromPrivate(privateKey);
    publicKey = keys.getPublic('hex');
}

Wallet.prototype.MakeWallet = function(){

}

Wallet.prototype.PublicKeyHash = function(){
    let hash = sha256(Buffer.from(msg, 'hex'));
    let publicKeyHash = new ripemd160().update(Buffer.from(hash, 'hex')).digest();
    return publicKeyHash;
}

Wallet.prototype.Checksum = function(){

}

Wallet.prototype.ValidateAddress = function(){

}