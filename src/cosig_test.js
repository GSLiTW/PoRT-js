const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const elliptic = require('elliptic');
const ecdsa = new elliptic.ec('secp256k1');
const BN = require('bn.js');

const Wallet = require('./wallet.js');

wallets = [];
publicKeys = [];

for(var i = 0; i < 7; i++) {
    wallets.push(new Wallet());
    publicKeys.push(wallets[i].publicKey);
}

// leader: wallets[0]
// witness: wallets[1:6]

// 1) Announcement: The leader multicasts an announcement
// of the start of this round down through the spanning tree,
// optionally including the statement S to be signed.
S = "Hello World!";


// 2) Commitment: Each node i picks a random secret vi and
// computes its individual commit Vi = G^vi.
vs = [];
Vs = [];
for(var i = 0; i < 7; i++) {
    var k = wallets[i].NewKeyPair();
    vs.push(k[0]);          
    Vs.push(k[1]);
}

V0_aggr = Vs[0];
for(var i = 1; i < 7; i++) {
    V0_aggr = V0_aggr.add(Vs[i]);
}

console.log("\nV0_aggr:", V0_aggr.encode('hex'));

// 3) Challenge: The leader computes a collective challenge c =
// H( ˆV0 || S), then multicasts c down through the tree, along
// with the statement S to be signed if it was not already
// announced in phase 1.
hash.update(V0_aggr.encode('hex') + S);
c = new BN(hash.copy().digest('hex'), 'hex');

console.log("\nc:", c.toString('hex'));





// 4) Response: In a final bottom-up phase, each node i waits
// to receive a partial aggregate response ˆrj from each of
// its immediate children j ∈ Ci.

rs = [];
for(var i = 0; i < 7; i++) {
    var v = new BN(vs[i].toString('hex'), 'hex');
    var x = new BN(wallets[i].privateKey.toString('hex'), 'hex');
    rs[i] = v-(x*c);
}

r0_aggr = rs[0];
for(var i = 1; i < 7; i++) {
    r0_aggr += rs[i];
}

console.log("\nr0_aggr:", r0_aggr);

// Verify

const keys = ecdsa.keyFromPrivate(r0_aggr.toString(16));
G_r0 = keys.getPublic();
X0 = publicKeys[0];
for(var i = 1; i < 7; i++) {
    X0 = X0.add(publicKeys[i]);
}
X0_c = X0.mul(c);

hash.update(G_r0.add(X0_c).encode('hex') + S);
console.log(G_r0.add(X0_c).encode('hex'));

