/* eslint-disable max-len */
/* eslint-disable new-cap */
/* eslint-disable require-jsdoc */
const Creator = require('../src/creator');
const MPT = require('../src/MPT');
const Wallet = require('../src/wallet');
const Block = require('../src/block.js');

const fs = require('fs');
const elliptic = require('elliptic');
// eslint-disable-next-line new-cap
const ecdsa = new elliptic.ec('secp256k1');

const user1Balance = 100;
const user1Tax = 10;
const user1Pubk = 2;
const user1Port = 1;
const tree = new MPT();
tree.Insert(user1Pubk, user1Balance, user1Tax, 1);
const creator = new Creator(user1Port, user1Pubk, tree);

test('#Test1 : Creator Construct', ()=>{
  expect(creator).toEqual({
    port: 1,
    MPT: tree,
    wallet: 2,
  });
});

test('#Test2 : isValid Function', ()=>{
  expect(creator.isValid()).toBeTruthy();
});

test('#Test3 : getVoter Function', () => {
  const voter1url = 'voter1';
  const voter1Pubk = 2;
  const voter1PubV = 2;
  const voter2url = 'voter2';
  const voter2Pubk = 3;
  const voter2PubV = 3;
  creator.getVoter(voter1url, voter1Pubk, voter1PubV);
  creator.getVoter(voter2url, voter2Pubk, voter2PubV);
  expect(creator.voterUrl).toEqual(['voter1', 'voter2']);
  expect(creator.voterPubKey).toEqual([2, 3]);
  expect(creator.voterPubV).toEqual([2, 3]);
});

test('#Test 4 : Set Voter\'s Index', () => {
  for (let index = 0; index < 5; index++) {
    creator.setVoterIndex(index);
  }
  expect(creator.voterIndex).toEqual([0, 1, 2, 3, 4]);
});
