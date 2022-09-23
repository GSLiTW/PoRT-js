/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable require-jsdoc */

describe('jump step selection test', () => {
  const Creator = require('../src/Creator/creator.js');
  const Voter = require('../src/Voter/voter.js');
  const MPT = require('../src/MPT/MPT.js');
  const Wallet = require('../src/Utility/wallet.js');
  const Block = require('../src/Block/block');
  const Blockchain = require('../src/Block/blockchain');
  const Transaction = require('../src/Transaction/transaction');
  const TxnPool = require('../src/Transaction/pending_transaction_pool.js');
  const CSVdata = require('../src/Transaction/CSV_data.js');

  const fs = require('fs');
  const elliptic = require('elliptic');
  // eslint-disable-next-line new-cap
  const ecdsa = new elliptic.ec('secp256k1');


  // Function used
  function insertCSVData(quantity, data) {
    txns = [];
    for (let i = 1; i < quantity; i++) {
      txns.push(new Transaction(data[i][0], data[i][2], data[i][3], data[i][4], T));
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

  // ReadFile
  const data = fs.readFileSync('./data/node_address_mapping_table.csv')
      .toString() // convert Buffer to string
      .split('\n') // split string to lines
      .map((e) => e.trim()) // remove white spaces for each line
      .map((e) => e.split(',').map((e) => e.trim())); // split each line to array

  const T = new MPT();

  for (let i = 0; i < 14; i++) {
    if (i == 2) T.Insert(data[i][2], 10000000000000, 1000000000 * 0.0001, [2, 1]); // dbit == 1 means creator
    else if (i == 4) T.Insert(data[i][2], 10000000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else if (i == 6) T.Insert(data[i][2], 10000000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else if (i == 8) T.Insert(data[i][2], 10000000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else T.Insert(data[i][2], 10000000000000, 1000000000 * 0.0001, [0, 0]);
  }
  const txspool = new TxnPool();
  const chain = new Blockchain(T);
  const targetblock = chain.getLastBlock();
  test('#test1: genesisBlock', () => {
    expect(targetblock.previousBlockHash).toEqual('0');
    expect(targetblock.timestamp).toEqual(1604671786702);
    expect(targetblock.height).toEqual(1);
    expect(targetblock.nextCreator).toEqual('04bfde01a8a6973c4ece805f9a46f83d076a00e310e37351b50ee9a619838ce19e6dca73814b3557845140d0e97850487277b5a7ba87f26bd0cf9d943ce7623b9b');
    expect(targetblock.nextVoters[0]).toEqual('046fbf49bb8134c53d50595895283d4ce3b09473561219c6869ee2300af5481553e43d84d49837bd5a73fe6a3ab9337ef68532e1bf14ef83fb2d42eaa55c237680');
    expect(targetblock.hash).toEqual('ff7ff1b24728377a5061e24c0bd6fce6986bc8ed25430e458193264c1d0102bf');
  });

  txspool.addTxs(createtxs(2));

  const secondBlock = new Block(2, txspool.transactions, chain.chain[0].hash, T);
  secondBlock.timestamp = 1604671786702;
  secondBlock.nextCreator = '04ddb66f61a02eb345d2c8da36fa269d8753c3a01863d28565f1c2cf4d4af8636fdd223365fd54c0040cb6401cfef4b1f2e3554ae9cc5de7a0fb9785a38aa724e8';
  secondBlock.nextVoters = ['040fb119adeaefa120c2cda25713da2523e36ebd0e0d5859bef2d96139583362d9f8420667557134c148405b5776102c633dfc3401a720eb5cdba05191fa371b7b', '04471e6c2ec29e66b89e816217d6f172959b60a2f13071cfeb698fdaed2e23e23b7693ed687088a736b8912f5cc81f3af46e6c486f64165e6818da2da713407f92', '04665d86db1e1be975cca04ca255d11da51928b1d5c4e18d5f3163dbc62d6a5536fa4939ced9ae9faf9e1624db5c9f4d9d64da3a9af93b9896d3ea0c52b41c296d'];
  test('#test2: Second genesisBlock', () => {
    expect(secondBlock.previousBlockHash).toEqual('ff7ff1b24728377a5061e24c0bd6fce6986bc8ed25430e458193264c1d0102bf');
    expect(secondBlock.timestamp).toEqual(1604671786702);
    expect(secondBlock.height).toEqual(2);
    expect(secondBlock.nextCreator).toEqual('04ddb66f61a02eb345d2c8da36fa269d8753c3a01863d28565f1c2cf4d4af8636fdd223365fd54c0040cb6401cfef4b1f2e3554ae9cc5de7a0fb9785a38aa724e8');
    expect(secondBlock.nextVoters[0]).toEqual('040fb119adeaefa120c2cda25713da2523e36ebd0e0d5859bef2d96139583362d9f8420667557134c148405b5776102c633dfc3401a720eb5cdba05191fa371b7b');
  });

  const creator = new Creator(3002, '04bfde01a8a6973c4ece805f9a46f83d076a00e310e37351b50ee9a619838ce19e6dca73814b3557845140d0e97850487277b5a7ba87f26bd0cf9d943ce7623b9b', T, chain);
  const voter1 = new Voter(3004, '046fbf49bb8134c53d50595895283d4ce3b09473561219c6869ee2300af5481553e43d84d49837bd5a73fe6a3ab9337ef68532e1bf14ef83fb2d42eaa55c237680', T);
  const voter2 = new Voter(3006, '0482c4b01761ab85fcabebbb1021e032ac58c62d184a80a588e7ba6d01928cb0402bb174b6e7e9ce7528630bc9963bf7643320365ab88ee6500ad3eb2f91e0efcd', T);
  const voter3 = new Voter(3008, '0446a08e02df8950c6c5d1a1199747efab9fb5aadcdd79a95139f35bfbcf31f9ef8b116bad1012984521b6e7f07d1d8c67894d7d52880f894c93ff9c0aff439eb4', T);
});
