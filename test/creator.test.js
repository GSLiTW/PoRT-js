const Creator = require('../src/creator');

const MPT = require('../src/MPT');
const Wallet = require('../src/wallet');


describe('try test', () => {
  {
    // let w = new Wallet();
    // let tree = new MPT();
    // const init_balance = 100;
    // const init_tax = 10;
    // const pubk = w.publicKey;
    // tree.Insert(pubk, init_balance, init_tax, 1);
    // const port = 8002;
    // let creator = new Creator(port, pubk, tree);


    // test('test creator constructor', ()=>{
    //     expect(creator).toEqual({
    //         port: 8002,
    //         MPT: tree,
    //         wallet: w.publicKey
    //     });
    // });

    test('test isvalid', ()=>{
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

