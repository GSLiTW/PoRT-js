// const Buffer = require('safe-buffer').Buffer; 
// const BigInteger = require('bigi');
// const schnorr = require('bip-schnorr');
// const convert = schnorr.convert;
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const elliptic = require('elliptic');
const ecdsa = new elliptic.ec('secp256k1');

const Wallet = require('./wallet.js');

wallets = [];
publicKeys = [];

for(var i = 0; i < 7; i++) {
    wallets.push(new Wallet());
    publicKeys.push(wallets[i].publicKey);
    // console.log("Wallet", i+1, ":\npriv:", wallets[i].privateKey, "\npub:", wallets[i].publicKey);
}

// leader: wallets[0]
// witness: wallets[1:6]

// 1) Announcement: The leader multicasts an announcement
// of the start of this round down through the spanning tree,
// optionally including the statement S to be signed.


// 2) Commitment: Each node i picks a random secret vi and
// computes its individual commit Vi = G^vi.
vs = [];
Vs = [];
for(var i = 0; i < 7; i++) {
    var k = wallets[i].NewKeyPair();
    vs.push(k[0]);          
    Vs.push(k[1]);
}

for(var i = 2; i >= 0; i--) {
    var V = Vs[i].add(Vs[2*i+1]).add(Vs[2*i+2]);
    Vs[i] = V;
}



// 3) Challenge: The leader computes a collective challenge c =
// H( ˆ V0  S), then multicasts c down through the tree, along
// with the statement S to be signed if it was not already
// announced in phase 1.
hash.update(Vs[0].encode('hex') + "Hello World!");
c = BigInt("0x"+hash.copy().digest('hex'));
console.log(hash.copy().digest('hex'));



// 4) Response: In a final bottom-up phase, each node i waits
// to receive a partial aggregate response ˆrj from each of
// its immediate children j ∈ Ci.

rs = [];
for(var i = 6; i >= 0; i--) {
    var v = BigInt("0x"+vs[i].toString('hex'));
    var x = BigInt("0x"+wallets[i].privateKey.toString('hex'));
    rs[i] = v-x*c;
    if(i < 3) {
        rs[i] = rs[i] + rs[2*i+1] + rs[2*i+2];
    }
}

const keys = ecdsa.keyFromPrivate(Buffer.from(rs[0].toString(16)));
G_r0 = keys.getPublic();
X0_c = publicKeys[0].mul(c);

hash.update(G_r0.add(X0_c).encode('hex') + "Hello World!");
console.log(hash.copy().digest('hex'));
