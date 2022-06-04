/* eslint-disable require-jsdoc */
const Creator = require('../src/creator');

const MPT = require('../src/MPT');
const Wallet = require('../src/wallet');


describe('try test', () => {
  {
    function init() {
      const w = new Wallet();
      const tree = new MPT();
      const init_balance = 100;
      const init_tax = 10;
      const pubk = w.publicKey;
      tree.Insert(pubk, init_balance, init_tax, 1);
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

        }
      }
      init(callback);
    });

    test('test isvalid function', ()=>{
      function callback() {
        try {
          expect(creator.IsValid()).toBeTruthy();
        } catch (e) {

        }
      }
      init(callback);
    });
  }
});

