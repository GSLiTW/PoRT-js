const sha256 = require("sha256");
const secureRandom = require('secure-random');
const elliptic = require('elliptic');
const ripemd160 = require('ripemd160');
const base58 = require('bs58');
const BigInteger = require("bigi");

const CHECKSUM_LENGTH = 4; // 4 bytes

function Wallet(prik='', pubk='', bal=0) {
    this.balance = bal;
    this.privateKey = prik;
    this.publicKey = pubk;
    
    
    // data only known by the individual party, these values are never shared
    // between the signers!
    this.signerPrivateData = {
        privateKey: 0,
        session: null
    };

    if(prik == '' || pubk == ''){
        this.NewKeyPair();
    }
};

Wallet.prototype.NewKeyPair = function(){
    this.privateKey = secureRandom.randomBuffer(32);
    this.signerPrivateData.privateKey = BigInteger.fromBuffer(this.privateKey);
    const ecdsa = new elliptic.ec('secp256k1');
    const keys = ecdsa.keyFromPrivate(this.privateKey);
    this.publicKey = keys.getPublic('hex');     //integer
    //console.log("Private Key: ", this.privateKey);
    //console.log("Public Key: ", this.publicKey);
    //console.log("this.signerPrivateData.privateKey", this.signerPrivateData.privateKey);
}

Wallet.prototype.PublicKeyHash = function(){
    let hash = sha256(Buffer.from(publicKey, 'hex'));
    // console.log("Public Key:", publicKey)
    let publicKeyHash = new ripemd160().update(Buffer.from(hash, 'hex')).digest();
    // console.log(publicKeyHash.toString('hex'))
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
    // console.log("PublicKeyHash: ", pubHash)
    var versionedHash = "00" + pubHash;
    // console.log("VersionedHash: ", versionedHash)
    var checksum = this.Checksum(versionedHash);
    // console.log("CHecksum: ", checksum);
    var fullHash = versionedHash + checksum.toString('hex');
    // console.log("FUllHash: ", fullHash)
    
    return base58.encode(Buffer.from(fullHash,'hex'));
}

Wallet.prototype.Sign = function(dataHash) {
    const ecdsa = new elliptic.ec('secp256k1');
    let signature = ecdsa.sign(dataHash, privateKey, "hex", {canonical:true});
    return signature;
}

Wallet.prototype.ValidateAddress = function(address){
    var pubHash = base58.decode(address);
    // console.log("pubHash:", pubHash);
    var actualChecksum = pubHash.subarray(pubHash.length - CHECKSUM_LENGTH);
    // console.log("actualChecksum:", actualChecksum);
    var version = pubHash.subarray(0,1);
    var pubHash = pubHash.subarray(1,pubHash.length - CHECKSUM_LENGTH);
    var targetChecksum = this.Checksum(Buffer.concat([version, pubHash]));
    // console.log("targetChecksum:", targetChecksum)

    return (actualChecksum.compare(targetChecksum) == 0)

}

module.exports = Wallet;

//w = new Wallet();
// console.log(w.Address(), base58.decode(w.Address()).toString('hex'));
// console.log(w.ValidateAddress(w.Address()));
// console.log((w.Sign("123")),(w.Sign("123")));
