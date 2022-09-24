const Txn_Pool = require('../src/Transaction/pending_transaction_pool');
const Blockchain = require('../src/Block/blockchain.js');
const MPT = require('../src/MPT/MPT');
const fs = require('fs');
const Txn = require('../src/Transaction/transaction')


describe('txpooltest', () => {
	// Applies only to tests in this describe block
	//beforeAll(() => {
  const data = fs.readFileSync('./data/node_address_mapping_table.csv')
    .toString() // convert Buffer to string
    .split('\n') // split string to lines
    .map((e) => e.trim()) // remove white spaces for each line
    .map((e) => e.split(',').map((e) => e.trim())); // split each line to array

  const Tree = new MPT(true);
  console.log(typeof(Tree))
  for (var i = 0; i < 157; i++) {
    if (i == 2) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 1); // dbit == 1 means creator
    else if (i == 4) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
    else if (i == 6) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
    else if (i == 8) Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 2); // dbit == 2 means voter
    else Tree.Insert(data[i][2], 1000, 1000 * 0.0001, 0);
  }
    
  const chain = new Blockchain(Tree);
	//});
  
	// test('test create', () => {
  //   var txpool = new Txn_Pool();
  //   txpool.create(3, Tree);
  //   expect(txpool.get_num_of_transaction()).toBe(49);
  // });
  
  test('test validate', () => {
    var txpool = new Txn_Pool();
    txpool.addTx(new Txn('0x43a1a360188faaa2b227c1133d66e155c240816b33d6cba682e9ab27dbc77012', '04f586957689dd425776cb9dabf6c8fa5b311a175ede33e1e85b54c931b6d8fb14f8085a1b095e6886a25bbe346da08eb05e605f100e67272da7dac4d4c43d60bc', '04ddb66f61a02eb345d2c8da36fa269d8753c3a01863d28565f1c2cf4d4af8636fdd223365fd54c0040cb6401cfef4b1f2e3554ae9cc5de7a0fb9785a38aa724e8', '-1', 0, "7120cf47be886d1d4e15db3f3dd793a6e6407da773eeaf6b3e154fb8d9572b2a", "55e307929f431fd0917ffb56c645881306231e9cb9b65c7804ea7f339305fbd3", Tree));
    expect(txpool.get_num_of_transaction()).toBe(0);
  });

  test('test clean', () => {
    var block1Txs = JSON.parse(fs.readFileSync('./src/Block/Block1txs.json', 'utf8'));
    let InitTxs = []
    for(let i = 0; i<Object.keys(block1Txs.txs).length; i++){
      InitTxs.push(new Txn(block1Txs.txs[i].id, block1Txs.txs[i].sender, block1Txs.txs[i].receiver, block1Txs.txs[i].value, block1Txs.txs[i].v, block1Txs.txs[i].r, block1Txs.txs[i].s, Tree))
    }
    const txn_pool = new Txn_Pool(InitTxs);
    txn_pool.clean();
    expect(txn_pool.get_num_of_transaction()).toBe(0);
  });

  test('test repeat', () => {
    var block1Txs = JSON.parse(fs.readFileSync('./src/Block/Block1txs.json', 'utf8'));
    let InitTxs = []
    for(let i = 0; i<Object.keys(block1Txs.txs).length; i++){
      InitTxs.push(new Txn(block1Txs.txs[i].id, block1Txs.txs[i].sender, block1Txs.txs[i].receiver, block1Txs.txs[i].value, block1Txs.txs[i].v, block1Txs.txs[i].r, block1Txs.txs[i].s, Tree))
    }
    const txn_pool = new Txn_Pool(InitTxs);
    txn_pool.addTxs(InitTxs);
    expect(txn_pool.get_num_of_transaction()).toBe(4);
  });

  test('test remove', () => {
    var block1Txs = JSON.parse(fs.readFileSync('./src/Block/Block1txs.json', 'utf8'));
    let InitTxs = []
    for(let i = 0; i<Object.keys(block1Txs.txs).length; i++){
      InitTxs.push(new Txn(block1Txs.txs[i].id, block1Txs.txs[i].sender, block1Txs.txs[i].receiver, block1Txs.txs[i].value, block1Txs.txs[i].v, block1Txs.txs[i].r, block1Txs.txs[i].s, Tree))
    }
    const txn_pool = new Txn_Pool(InitTxs);
    tx = new Txn('0x43a1a360188faaa2b227c1133d66e155c240816b33d6cba682e9ab27dbc77012', '04f586957689dd425776cb9dabf6c8fa5b311a175ede33e1e85b54c931b6d8fb14f8085a1b095e6886a25bbe346da08eb05e605f100e67272da7dac4d4c43d60bc', '04ddb66f61a02eb345d2c8da36fa269d8753c3a01863d28565f1c2cf4d4af8636fdd223365fd54c0040cb6401cfef4b1f2e3554ae9cc5de7a0fb9785a38aa724e8', '-1', 0, "7120cf47be886d1d4e15db3f3dd793a6e6407da773eeaf6b3e154fb8d9572b2a", "55e307929f431fd0917ffb56c645881306231e9cb9b65c7804ea7f339305fbd3", Tree)
    txn_pool.remove(tx)
    expect(txn_pool.get_num_of_transaction()).toBe(3);
  });
});