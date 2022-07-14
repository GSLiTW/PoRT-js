/* eslint-disable new-cap */
/* eslint-disable require-jsdoc */
const Creator = require('../src/creator');
const MPT = require('../src/MPT');
const Wallet = require('../src/wallet');

const fs = require('fs');
const elliptic = require('elliptic');
// eslint-disable-next-line new-cap
const ecdsa = new elliptic.ec('secp256k1');


describe('creator test', () => {
  {
    function init() {
      const user1Balance = 100;
      const user1Tax = 10;
      const user1Pubk = 1;
      const user1Port = 1;
      const tree = new MPT();
      tree.Insert(user1Pubk, user1Balance, user1Tax, 1);
      const creator = new Creator(user1Port, user1Pubk, tree);
      console.log('Init Finish');
    }

    test('test creator constructor', ()=>{
      function callback() {
        try {
          expect(creator).toEqual({
            port: 1,
            MPT: tree,
            wallet: 1,
          });
        } catch (e) {
          console.error(e);
        }
      }
      init(callback);
    });

    test('test isvalid function', ()=>{
      function callback() {
        try {
          expect(creator.isValid()).toBeTruthy();
        } catch (e) {
          console.error(e);
        }
      }
      init(callback);
    });

    test('test getVoter', () => {
      function callback() {
        try {
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
        } catch (e) {
          console.log(e);
        }
      }
      init(callback);
    });
  }
});

