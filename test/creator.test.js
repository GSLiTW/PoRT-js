/* eslint-disable require-jsdoc */
const Creator = require('../src/creator');
const MPT = require('../src/MPT');
const Wallet = require('../src/wallet');

const fs = require('fs');
const elliptic = require('elliptic');
// eslint-disable-next-line new-cap
const ecdsa = new elliptic.ec('secp256k1');


describe('try test', () => {
  {
    function init() {
      const users = fs.readFileSync('./data/node_address_mapping_table.csv')
          .toString().split('\n').map((e) => e.trim())
          .map((e) => e.split(',').map((e) => e.trim()));

      const keypair = fs.readFileSync('./data/private_public_key.csv')
          .toString().split('\n').map((e) => e.trim())
          .map((e) => e.split(',').map((e) => e.trim()));

      const w = new Wallet();
      const tree = new MPT();
      const initBalance = 100;
      const initTax = 10;
      const pubk = w.publicKey;
      tree.Insert(pubk, initBalance, initTax, 1);
      const port = 8002;
      const creator = new Creator(port, pubk, tree);
      console.log('Create Finish');
    }

    test('test creator constructor', ()=>{
      function callback() {
        try {
          expect(creator).toEqual({
            port: 8002,
            MPT: tree,
            wallet: w.publicKey,
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
  }
});

