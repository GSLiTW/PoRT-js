const Voter = require('../src/Voter/voter.js');
const MPT = require('../src/MPT/MPT.js');
const Wallet = require('../src/Utility/wallet.js');
const Block = require('../src/Block/block');
const Blockchain = require('../src/Block/blockchain');
const fs = require('fs');
const sha256 = require('sha256');
const secureRandom = require('secure-random');
const elliptic = require('elliptic');
const ripemd160 = require('ripemd160');
const base58 = require('bs58');
const BigInteger = require('bigi');
const ecdsa = new elliptic.ec('secp256k1');
let sha3 = require('js-sha3');


describe('voter_test', () => {

    const data = fs.readFileSync('./data/node_address_mapping_table.csv')
    .toString() // convert Buffer to string
    .split('\n') // split string to lines
    .map((e) => e.trim()) // remove white spaces for each line
    .map((e) => e.split(',').map((e) => e.trim())); // split each line to array

    let w = fs.readFileSync('./data/private_public_key.csv')
    .toString() // convert Buffer to string
    .split('\n') // split string to lines
    .map((e) => e.trim()) // remove white spaces for each line
    .map((e) => e.split(',').map((e) => e.trim())); // split each line to array

  const Tree = new MPT(true);
  const wallet = new Wallet(w[4][1], w[4][2]);
  
for (let i = 0; i < 157; i++) {
    if (i == 2) Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 1]); // dbit == 1 means creator
    else if (i == 4) Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else if (i == 6) Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else if (i == 8) Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [0, 0]);
  }
  
  
  const chain = new Blockchain(Tree);


  test('voter construction', () => {

    voter = new Voter(3004, wallet, Tree, chain);

    //expect(voter.wallet.privateKey).toMatch("d03e5191333fe476a8d18b141093bde4bbc618763836c3cd9d9b2bb07c30f900");
    //expect(voter.wallet.publicKey).toMatch("046fbf49bb8134c53d50595895283d4ce3b09473561219c6869ee2300af5481553e43d84d49837bd5a73fe6a3ab9337ef68532e1bf14ef83fb2d42eaa55c237680");
  });

  test('verify signature', () => {
    let tx_hash = "43a1a360188faaa2b227c1133d66e155c240816b33d6cba682e9ab27dbc77012";
    //let privateKey = "d756e19af3303ea489eb5a8c5a44ac10a38317fc7ee85ec599bf158232601aa8";
    let keyPair = ecdsa.keyFromPrivate("d756e19af3303ea489eb5a8c5a44ac10a38317fc7ee85ec599bf158232601aa8");
    let privateKey = keyPair.getPrivate("hex");
    let publicKey = "04f586957689dd425776cb9dabf6c8fa5b311a175ede33e1e85b54c931b6d8fb14f8085a1b095e6886a25bbe346da08eb05e605f100e67272da7dac4d4c43d60bc";
    let signature = ecdsa.sign(tx_hash, privateKey, 'hex', {canonical: true});
    let hexToDecimal = (x) => ecdsa.keyFromPrivate(x, "hex").getPrivate().toString(10);
    let pubKeyRecovered = ecdsa.recoverPubKey(
          hexToDecimal(tx_hash), signature, signature.recoveryParam, "hex");
    console.log("Recovered pubKey:", pubKeyRecovered.encodeCompressed("hex"));
    //console.log("Public key compressed:", publicKey.encodeCompressed("hex"));


    //let validSig = ecdsa.verify(tx_hash, signature, publicKey);
    //expect(pubKeyRecovered).toMatch("0000");
    expect(ecdsa.verify(tx_hash, signature, pubKeyRecovered)).toBeTruthy();

  });
  
/*
  test('verify signature', () => {
    let keyPair = ec.keyFromPrivate("d756e19af3303ea489eb5a8c5a44ac10a38317fc7ee85ec599bf158232601aa8");
    let privKey = keyPair.getPrivate("hex");
    let pubKey = keyPair.getPublic();
    console.log(`Private key: ${privKey}`);
console.log("Public key :", pubKey.encode("hex").substr(2));
console.log("Public key1 :", pubKey.encode("hex"));
console.log("Public key (compressed):",
    pubKey.encodeCompressed("hex"));

    let msg = 'Message for signing';
    let msgHash = sha3.keccak256(msg);
    let signature = ec.sign(msgHash, privKey, "hex", {canonical: true});
    console.log(`Msg: ${msg}`);
    console.log(`Msg hash: ${msgHash}`);
    console.log("Signature:", signature);
    let hexToDecimal = (x) => ec.keyFromPrivate(x, "hex").getPrivate().toString(10);
    let pubKeyRecovered = ec.recoverPubKey(
    hexToDecimal(msgHash), signature, signature.recoveryParam, "hex");
    console.log("Recovered pubKey:", pubKeyRecovered.encodeCompressed("hex"));
    let validSig = ec.verify(msgHash, signature, pubKeyRecovered);
    console.log("mag")
    expect(validSig).toBeTruthy();


    });

  */

});

