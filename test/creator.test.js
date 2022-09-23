/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable require-jsdoc */

describe('jump step selection test', () => {
  const Creator = require('../src/Creator/creator.js');
  const MPT = require('../src/MPT/MPT.js');
  const Wallet = require('../src/Utility/wallet.js');
  const Block = require('../src/Block/block');
  const Blockchain = require('../src/Block/blockchain');
  const TxnPool = require('../src/Transaction/pending_transaction_pool.js');

  const fs = require('fs');
  const elliptic = require('elliptic');
  // eslint-disable-next-line new-cap
  const ecdsa = new elliptic.ec('secp256k1');


  // Function used
  function insertCSVData(quantity, data) {
    txns = [];
    for (let i = 1; i < quantity; i++) {
      txns.push(new Transaction(data[i][0], data[i][2], data[i][3], data[i][4], Tree));
    }
    return txns;
  };

  function createtxs(num) {
    const csvdata = new CSV_data();
    const data_ = csvdata.getData(num); // get data of block1
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
    if (i == 2) T.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 1]); // dbit == 1 means creator
    else if (i == 4) T.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else if (i == 6) T.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else if (i == 8) T.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else T.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [0, 0]);
  }
  const txspool = new TxnPool();
  const chain = new Blockchain(T);
  targetblock = chain.getLastBlock();
  test('#test1: genesisBlock nextmaintainer', () => {
    expect(targetblock.timestamp).toEqual(1604671786702);
    expect(targetblock.height).toEqual(1);
    expect(targetblock.nextCreator).toEqual('04bfde01a8a6973c4ece805f9a46f83d076a00e310e37351b50ee9a619838ce19e6dca73814b3557845140d0e97850487277b5a7ba87f26bd0cf9d943ce7623b9b');
    expect(targetblock.nextVoters[0]).toEqual('046fbf49bb8134c53d50595895283d4ce3b09473561219c6869ee2300af5481553e43d84d49837bd5a73fe6a3ab9337ef68532e1bf14ef83fb2d42eaa55c237680');
    expect(targetblock.hash).toEqual('efedbf3035d5a375a093390217a6498c4489bdd4286f6f667855b738d815aeb2');
  });

  // let secondBlock = new Block(2, txspool.transactions, chain.chain[0].hash, T);
  // test('#test2: Creator isValid', () => {

  // });
});
