/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable require-jsdoc */
const Creator = require('../src/Creator/creator.js');
const MPT = require('../src/MPT/MPT.js');
const Wallet = require('../src/Utility/wallet.js');
const Block = require('../src/Block/block');
const Blockchain = require('../src/Block/blockchain');

const fs = require('fs');
const elliptic = require('elliptic');
// eslint-disable-next-line new-cap
const ecdsa = new elliptic.ec('secp256k1');

const user1Balance = 100;
const user1Tax = 10;
const user1Pubk = 2;
const user1Port = 1;
const tree = new MPT();
tree.Insert(user1Pubk, user1Balance, user1Tax, [2, 1]);
const creator = new Creator(user1Port, user1Pubk, tree);

// test('#Test1 : Creator Construct', ()=>{
//   expect(creator).toEqual({
//     port: 1,
//     MPT: tree,
//     wallet: 2,
//   });
// });

// // test('#Test2 : isValid Function', ()=>{
// //   expect(creator.isValid()).toBeTruthy();
// // });

// test('#Test3 : getVoter Function', () => {
//   const voter1url = 'voter1';
//   const voter1Pubk = 2;
//   const voter1PubV = 2;
//   const voter2url = 'voter2';
//   const voter2Pubk = 3;
//   const voter2PubV = 3;
//   creator.getVoter(voter1url, voter1Pubk, voter1PubV);
//   creator.getVoter(voter2url, voter2Pubk, voter2PubV);
//   expect(creator.voterUrl).toEqual(['voter1', 'voter2']);
//   expect(creator.voterPubKey).toEqual([2, 3]);
//   expect(creator.voterPubV).toEqual([2, 3]);
// });

// test('#Test 4 : Set Voter\'s Index', () => {
//   for (let index = 0; index < 5; index++) {
//     creator.setVoterIndex(index);
//   }
//   expect(creator.voterIndex).toEqual([0, 1, 2, 3, 4]);
// });

describe('jump step selection test', () => {
  const blockchain = require('../src/Block/blockchain');
  const MPT = require('../src/MPT/MPT');
  const Creator = require('../src/Creator/Creator');
  const fs = require('fs');

  const data = fs.readFileSync('./data/node_address_mapping_table.csv')
      .toString() // convert Buffer to string
      .split('\n') // split string to lines
      .map((e) => e.trim()) // remove white spaces for each line
      .map((e) => e.split(',').map((e) => e.trim())); // split each line to array

  const T = new MPT();

  for (let i = 0; i < 157; i++) {
    if (i == 2) T.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 1]); // dbit == 1 means creator
    else if (i == 4) T.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else if (i == 6) T.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else if (i == 8) T.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else T.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [0, 0]);
  }

  const chain = new blockchain(T);
  targetblock = chain.getLastBlock();
  test('#test1: genesisBlock nextmaintainer', () => {
    expect(targetblock.nextCreator).toEqual('04bfde01a8a6973c4ece805f9a46f83d076a00e310e37351b50ee9a619838ce19e6dca73814b3557845140d0e97850487277b5a7ba87f26bd0cf9d943ce7623b9b');
    expect(targetblock.nextVoters[0]).toEqual('046fbf49bb8134c53d50595895283d4ce3b09473561219c6869ee2300af5481553e43d84d49837bd5a73fe6a3ab9337ef68532e1bf14ef83fb2d42eaa55c237680');
  });
  test('#test2: Creator isValid', () => {
    const creator = new Creator(3002, '0xbb1f28e0f2b18c02c540903e5e4e30fcaa940578', T, chain);
  });
});
