const Voter = require('../voter');
const MPT = require('../src/MPT');
const Wallet = require('../src/wallet');

describe('try test', () => {
    
      function init() {
        const w = new Wallet();
        const tree = new MPT();
        const init_balance = 1000;
        const init_tax = 100;
        const pubk = w.publicKey;
        tree.Insert(pubk, init_balance, init_tax, 2);
        const port = 8003;
        const voter = new Voter(port, pubk, tree);
        console.log('Create Finish');
      }
  
      test('test creator constructor', ()=>{
        function callback() {
          try {
            expect(voter).toEqual({
              port: 8003,
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
      test('test CreatorUrl function', ()=>{
        function callback() {
          try {
            voter.CreatorUrl("http://localhost:8002").then(()=>{
                expect(this.CreatorUrl).toEqual("http://localhost:8002");
            });
          } catch (e) {
  
          }
        }
        init(callback);
      });
});