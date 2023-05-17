/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable require-jsdoc */

describe('genesis blocks and creator and voter check', () => {
  const Creator = require('../src/Creator/creator.js');
  const Voter = require('../src/Voter/voter.js');
  // const MPT = require('../src/MPT/MPT.js');
  const Wallet = require('../src/Utility/wallet.js');
  // const Block = require('../src/Block/block');
  const Blockchain = require('../src/Block/blockchain');
  const Transaction = require('../src/Transaction/transaction');
  // const TxnPool = require('../src/Transaction/pending_transaction_pool.js');
  const CSVdata = require('../src/Transaction/CSV_data.js');

  const fs = require('fs');
  const elliptic = require('elliptic');
  // eslint-disable-next-line new-cap
  // const ecdsa = new elliptic.ec('secp256k1');


  // Function used
  function insertCSVData(quantity, data) {
    txns = [];
    for (let i = 1; i <= quantity; i++) {
      const ecdsa = new elliptic.ec('secp256k1');
      const sig = ecdsa.sign(data[i][0], keytable.get(data[i][2]), 'hex', {canonical: true});
      chain.addTransactionToPendingTransaction(new Transaction(data[i][0], data[i][2], data[i][3], data[i][4], sig, chain.MPT));
    }
    return null;
  };

  function createtxs(num) {
    const csv = new CSVdata();
    const data_ = csv.getData(num); // get data of block1
    if (num == 3 || num == 4) {
      return insertCSVData(4, data_);
    } else if (num == 5) {
      return insertCSVData(4, data_);
    } else console.error('wrong block number.');
  };

  // ReadFile
  const data = fs.readFileSync('./data/node_address_mapping_table.csv')
      .toString() // convert Buffer to string
      .split('\n') // split string to lines
      .map((e) => e.trim()) // remove white spaces for each line
      .map((e) => e.split(',').map((e) => e.trim())); // split each line to array

  const w = fs.readFileSync('./data/private_public_key.csv')
      .toString() // convert Buffer to string
      .split('\n') // split string to lines
      .map((e) => e.trim()) // remove white spaces for each line
      .map((e) => e.split(',').map((e) => e.trim())); // split each line to array

  const keytable = new Map();
  w.forEach((w) => {
    keytable.set(w[2], w[1]);
  });

  const chain = new Blockchain();
  const genesisblock = chain.chain[0];
  const secondblock = chain.getLastBlock();

  test('#test1: genesisBlock', () => {
    expect(genesisblock.previousBlockHash).toEqual('0');
    expect(genesisblock.timestamp).toEqual(0);
    expect(genesisblock.height).toEqual(1);
    expect(genesisblock.nextCreator).toEqual(['04bfde01a8a6973c4ece805f9a46f83d076a00e310e37351b50ee9a619838ce19e6dca73814b3557845140d0e97850487277b5a7ba87f26bd0cf9d943ce7623b9b']);
    expect(genesisblock.nextVoters[0]).toEqual('046fbf49bb8134c53d50595895283d4ce3b09473561219c6869ee2300af5481553e43d84d49837bd5a73fe6a3ab9337ef68532e1bf14ef83fb2d42eaa55c237680');
    expect(genesisblock.nextVoters[1]).toEqual('0482c4b01761ab85fcabebbb1021e032ac58c62d184a80a588e7ba6d01928cb0402bb174b6e7e9ce7528630bc9963bf7643320365ab88ee6500ad3eb2f91e0efcd');
    expect(genesisblock.nextVoters[2]).toEqual('0446a08e02df8950c6c5d1a1199747efab9fb5aadcdd79a95139f35bfbcf31f9ef8b116bad1012984521b6e7f07d1d8c67894d7d52880f894c93ff9c0aff439eb4');
    expect(genesisblock.hash).toEqual('501cdbedcea248f8f5c832998b02b0b0a09d10ee13c9f38fd1e2aab73719bf6a');
  });

  test('#test2: secondBlock', () => {
    expect(secondblock.previousBlockHash).toEqual('501cdbedcea248f8f5c832998b02b0b0a09d10ee13c9f38fd1e2aab73719bf6a');
    expect(secondblock.timestamp).toEqual(1);
    expect(secondblock.height).toEqual(2);
    expect(secondblock.nextCreator).toEqual(['04ddb66f61a02eb345d2c8da36fa269d8753c3a01863d28565f1c2cf4d4af8636fdd223365fd54c0040cb6401cfef4b1f2e3554ae9cc5de7a0fb9785a38aa724e8']);
    expect(secondblock.nextVoters[0]).toEqual('040fb119adeaefa120c2cda25713da2523e36ebd0e0d5859bef2d96139583362d9f8420667557134c148405b5776102c633dfc3401a720eb5cdba05191fa371b7b');
    expect(secondblock.nextVoters[1]).toEqual('04471e6c2ec29e66b89e816217d6f172959b60a2f13071cfeb698fdaed2e23e23b7693ed687088a736b8912f5cc81f3af46e6c486f64165e6818da2da713407f92');
    expect(secondblock.nextVoters[2]).toEqual('04665d86db1e1be975cca04ca255d11da51928b1d5c4e18d5f3163dbc62d6a5536fa4939ced9ae9faf9e1624db5c9f4d9d64da3a9af93b9896d3ea0c52b41c296d');
    expect(secondblock.hash).toEqual('0d997854563a027a887615c732016ea306241bbc23b6c2dc9236b2ec9cf5a128');
  });


  createtxs(3);
  const txspool = chain.txn_pool;

  const creatorWallet = new Wallet(keytable.get(data[2][2]), data[2][2]);
  const creator = new Creator(3002, creatorWallet, chain);
  const voter1Wallet = new Wallet(keytable.get(data[3][2]), data[3][2]);
  const voter2Wallet = new Wallet(keytable.get(data[5][2]), data[5][2]);
  const voter3Wallet = new Wallet(keytable.get(data[7][2]), data[7][2]);
  const voter1 = new Voter(3003, voter1Wallet, chain);
  const voter2 = new Voter(3005, voter2Wallet, chain);
  const voter3 = new Voter(3007, voter3Wallet, chain);

  test('#test3: creator is valid', () => {
    expect(creator.isValid()).toBeTruthy();
  });
  const newBlock = creator.constructNewBlock(chain.txn_pool);
  test('#test4: creator construct new block', () => {
    expect(newBlock).toEqual(creator.block);
    expect(newBlock.transactions).toEqual(txspool.get_transaction());
    console.log(creator.MPT.Search('0482c4b01761ab85fcabebbb1021e032ac58c62d184a80a588e7ba6d01928cb0402bb174b6e7e9ce7528630bc9963bf7643320365ab88ee6500ad3eb2f91e0efcd'));
  });

  test('#test5: voter is valid', () => {
    expect(voter1.isValid()).toBeTruthy();
    expect(voter2.isValid()).toBeTruthy();
    expect(voter3.isValid()).toBeTruthy();
  });
});


describe('Cosig', () => {
  const Creator = require('../src/Creator/creator.js');
  const Voter = require('../src/Voter/voter.js');
  // const MPT = require('../src/MPT/MPT.js');
  const Wallet = require('../src/Utility/wallet.js');
  // const Block = require('../src/Block/block');
  const Blockchain = require('../src/Block/blockchain');
  const Transaction = require('../src/Transaction/transaction');
  // const TxnPool = require('../src/Transaction/pending_transaction_pool.js');
  const CSVdata = require('../src/Transaction/CSV_data.js');

  const fs = require('fs');
  const elliptic = require('elliptic');
  // eslint-disable-next-line new-cap
  // const ecdsa = new elliptic.ec('secp256k1');


  // Function used
  function insertCSVData(quantity, data) {
    txns = [];
    for (let i = 1; i <= quantity; i++) {
      const ecdsa = new elliptic.ec('secp256k1');
      const sig = ecdsa.sign(data[i][0], keytable.get(data[i][2]), 'hex', {canonical: true});
      chain.addTransactionToPendingTransaction(new Transaction(data[i][0], data[i][2], data[i][3], data[i][4], sig, chain.MPT));
    }
    return null;
  };

  function createtxs(num) {
    const csv = new CSVdata();
    const data_ = csv.getData(num); // get data of block1
    if (num == 3 || num == 4) {
      return insertCSVData(4, data_);
    } else if (num == 5) {
      return insertCSVData(4, data_);
    } else console.error('wrong block number.');
  };

  // ReadFile
  const data = fs.readFileSync('./data/node_address_mapping_table.csv')
      .toString() // convert Buffer to string
      .split('\n') // split string to lines
      .map((e) => e.trim()) // remove white spaces for each line
      .map((e) => e.split(',').map((e) => e.trim())); // split each line to array

  const w = fs.readFileSync('./data/private_public_key.csv')
      .toString() // convert Buffer to string
      .split('\n') // split string to lines
      .map((e) => e.trim()) // remove white spaces for each line
      .map((e) => e.split(',').map((e) => e.trim())); // split each line to array

  const keytable = new Map();
  w.forEach((w) => {
    keytable.set(w[2], w[1]);
  });

  const chain = new Blockchain();

  createtxs(3);
  const txspool = chain.txn_pool;

  const creatorWallet = new Wallet(keytable.get(data[2][2]), data[2][2]);
  const creator = new Creator(3002, creatorWallet, chain);
  const voter1Wallet = new Wallet(keytable.get(data[3][2]), data[3][2]);
  const voter2Wallet = new Wallet(keytable.get(data[5][2]), data[5][2]);
  const voter3Wallet = new Wallet(keytable.get(data[7][2]), data[7][2]);
  const voter1 = new Voter(3003, voter1Wallet, chain);
  const voter2 = new Voter(3005, voter2Wallet, chain);
  const voter3 = new Voter(3007, voter3Wallet, chain);

  const newBlock = creator.constructNewBlock(chain.txn_pool);
  creator.startCosig();
  creator.getVoter(voter1.port, voter1.wallet.publicKey, voter1.publicV);
  creator.getVoter(voter2.port, voter2.wallet.publicKey, voter2.publicV);
  creator.getVoter(voter3.port, voter3.wallet.publicKey, voter3.publicV);
  test('#test6: getVoter finish', () => {
    expect(creator.voterPubKey[0]).toEqual(voter1Wallet.publicKey);
    expect(creator.voterPubKey[1]).toEqual(voter2Wallet.publicKey);
    expect(creator.voterPubKey[2]).toEqual(voter3Wallet.publicKey);
    expect(creator.voterPubV[0]).toEqual(voter1.publicV);
    expect(creator.voterPubV[1]).toEqual(voter2.publicV);
    expect(creator.voterPubV[2]).toEqual(voter3.publicV);
  });

  creator.generateChallenge();
  console.log('challenge', creator.getChallenge());
  if (voter1.VerifyBlock(creator.block)) {
    voter1.GenerateResponse(creator.getChallenge());
  }
  if (voter2.VerifyBlock(creator.block)) {
    voter2.GenerateResponse(creator.getChallenge());
  }
  if (voter3.VerifyBlock(creator.block)) {
    voter3.GenerateResponse(creator.getChallenge());
  }
  creator.getResponses(voter1.response);
  creator.getResponses(voter2.response);
  creator.getResponses(voter3.response);
  creator.aggregateResponse();
});

// const newchain = creator.blockchain;
// txspool.clean();
// txspool.addTxs(createtxs(3));
// creator.constructNewBlock(txspool);
// console.log(creator.block);
// test('#test7: check PoRT', () => {
//   expect(creator.block.nextCreator).toEqual();
// });
// T = creator.MPT;
