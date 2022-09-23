/* eslint-disable max-len */
// const account = require('../src/block');


// test('new block', () => {
//     block = new Block();
//     const previousBlockHash = previousHash;
//     const merkleRoot = MPT.Cal_hash();
//     const timestamp = Date.now();
//     const height = height;
//     //variable
//     const receiptTree = null;
//     const CoSig = null;
//     const nextCreator = null;
//     const nextVoters = [];
//     const hash = null;
//     expect().toEqual({
//         //????
//     })
// });

test('#test1: genesisBlock', () => {
  const Blockchain = require('../src/Block/blockchain');
  const MPT = require('../src/MPT/MPT');
  const fs = require('fs');

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

  const chain = new Blockchain(T);
  targetblock = chain.getLastBlock();
  expect(targetblock.timestamp).toEqual(1604671786702);
  expect(targetblock.height).toEqual(1);
});
