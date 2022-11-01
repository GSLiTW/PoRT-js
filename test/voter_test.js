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
const Transaction = require('../src/Transaction/transaction');
const Pending_Txn_Pool = require('../src/Transaction/pending_transaction_pool.js');
const CSVdata = require('../src/Transaction/CSV_data.js');


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
///////modify
    const keytable = new Map();
    w.forEach(w => {
      keytable.set(w[2], w[1])
    })
////////////
  const Tree = new MPT(true);
  const wallet = new Wallet(w[4][1], w[4][2]);

  //////////////////modify
  function insertCSVData(quantity, data) {
    txns = [];
    for (let i = 1; i <= quantity; i++) {
      const ecdsa = new elliptic.ec('secp256k1');
      // console.log(data[i][2])
      // console.log(keytable.get(data[i][2]))
      const sig = ecdsa.sign(data[i][0], keytable.get(data[i][2]), 'hex', {canonical: true});
      txns.push(new Transaction(data[i][0], data[i][2], data[i][3], data[i][4], sig, Tree));
    }
    return txns;
  };

  function createtxs(num) {
    const csv = new CSVdata();
    const data_ = csv.getData(num); // get data of block1
    if (num == 1 || num == 2) {
      return insertCSVData(4, data_);
    } else if (num == 3) {
      return insertCSVData(4, data_);
    } else console.log('wrong block number.');
  };
/////////////////////////////////////////////////////
  
for (let i = 0; i < 157; i++) {
    if (i == 2) Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 1]); // dbit == 1 means creator
    else if (i == 4) Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else if (i == 6) Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else if (i == 8) Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [0, 0]);
  }
  
  
  const chain = new Blockchain(Tree);
  let voter = new Voter(3004, wallet, Tree, chain);
/////////modify
  const txspool = new Pending_Txn_Pool();
  txspool.addTxs(createtxs(2));
  let tempBlock = new Block(2, txspool.transactions, chain.chain[0].hash, Tree);
tempBlock.timestamp = 1604671786702;
tempBlock.hash = '0f274ddbe0d9031e4c599c494bddbdea481a5a5caf3d7f0ec28a05708b2302f1';
tempBlock.nextCreator = '04ddb66f61a02eb345d2c8da36fa269d8753c3a01863d28565f1c2cf4d4af8636fdd223365fd54c0040cb6401cfef4b1f2e3554ae9cc5de7a0fb9785a38aa724e8';
tempBlock.nextVoters = ['040fb119adeaefa120c2cda25713da2523e36ebd0e0d5859bef2d96139583362d9f8420667557134c148405b5776102c633dfc3401a720eb5cdba05191fa371b7b', '04471e6c2ec29e66b89e816217d6f172959b60a2f13071cfeb698fdaed2e23e23b7693ed687088a736b8912f5cc81f3af46e6c486f64165e6818da2da713407f92', '04665d86db1e1be975cca04ca255d11da51928b1d5c4e18d5f3163dbc62d6a5536fa4939ced9ae9faf9e1624db5c9f4d9d64da3a9af93b9896d3ea0c52b41c296d'];


  test('voter construction', () => {

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
  test('test VerifyTx', () => {

    let tx_id = "0x43a1a360188faaa2b227c1133d66e155c240816b33d6cba682e9ab27dbc77012";
    let tx_from = "04f586957689dd425776cb9dabf6c8fa5b311a175ede33e1e85b54c931b6d8fb14f8085a1b095e6886a25bbe346da08eb05e605f100e67272da7dac4d4c43d60bc";
    let tx_to = "04ddb66f61a02eb345d2c8da36fa269d8753c3a01863d28565f1c2cf4d4af8636fdd223365fd54c0040cb6401cfef4b1f2e3554ae9cc5de7a0fb9785a38aa724e8";
    let tx_value = 0.5;
    let tx_hash = "43a1a360188faaa2b227c1133d66e155c240816b33d6cba682e9ab27dbc77012";
    //let privateKey = "d756e19af3303ea489eb5a8c5a44ac10a38317fc7ee85ec599bf158232601aa8";
    let keyPair = ecdsa.keyFromPrivate("d756e19af3303ea489eb5a8c5a44ac10a38317fc7ee85ec599bf158232601aa8");
    let privateKey = keyPair.getPrivate("hex");
    let publicKey = "04f586957689dd425776cb9dabf6c8fa5b311a175ede33e1e85b54c931b6d8fb14f8085a1b095e6886a25bbe346da08eb05e605f100e67272da7dac4d4c43d60bc";
    let signature = ecdsa.sign(tx_hash, privateKey, 'hex', {canonical: true});
    
    let tx = new Transaction(tx_id, tx_from, tx_to, tx_value, signature, Tree);
    expect(voter.VerifyTx(tx)).toBeTruthy();
  });

  test('test VerifyBlock', () => {
    expect(voter.VerifyBlock(tempBlock)).toBeTruthy();
  });
/*
  test('test VerifyBlock for dirty block 1', () => {
console.log("tx_0's sender:",tempBlock.transactions[0].sender);
    tempBlock.transactions[0].sender=tempBlock.transactions[0].sender.substr(2)+"b2";
    console.log("tx_0's sender:",tempBlock.transactions[0].sender);
    expect(voter.VerifyBlock(tempBlock)).toBeTruthy();
  });
*/
  test('test VerifyBlock for dirty block 2', () => {
    console.log("tx_0's id:",tempBlock.transactions[0].id);
    let temp = tempBlock.transactions[0].id.substr(4)+"b2";
        tempBlock.transactions[0].id="0x"+temp;
        console.log("tx_0's id:",tempBlock.transactions[0].id);
        expect(voter.VerifyBlock(tempBlock)).toBeTruthy();
      });





});

