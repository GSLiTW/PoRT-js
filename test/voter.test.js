const Voter = require('../src/Voter/voter.js');
const MPT = require('../src/MPT/MPT.js');
const Wallet = require('../src/Utility/wallet.js');
const Block = require('../src/Block/block');
const Blockchain = require('../src/Block/blockchain');
const fs = require('fs');


describe('voter_test', () => {

    const data = fs.readFileSync('./data/node_address_mapping_table.csv')
    .toString() // convert Buffer to string
    .split('\n') // split string to lines
    .map((e) => e.trim()) // remove white spaces for each line
    .map((e) => e.split(',').map((e) => e.trim())); // split each line to array

    let w = fs.readFileSync('./data/private_public_key.csv')
    .toString() // convert Buffer to string
    .split('\n') // split string to lines
    .map((e) => e.trim()) // remove white spaces for each line
    .map((e) => e.split(',').map((e) => e.trim())); // split each line to array

  const Tree = new MPT(true);
  const wallet = new Wallet(w[4][1], w[4][2]);
  
for (let i = 0; i < 157; i++) {
    if (i == 2) Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 1]); // dbit == 1 means creator
    else if (i == 4) Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else if (i == 6) Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else if (i == 8) Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]); // dbit == 2 means voter
    else Tree.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [0, 0]);
  }
  
  
  const chain = new Blockchain(Tree);


  test('voter construction', () => {

    voter = new Voter(3004, wallet, Tree, chain);

    expect(voter.secretv).toMatch('d03e5191333fe476a8d18b141093bde4bbc618763836c3cd9d9b2bb07c30f900');
    expect(voter.publicV).toMatch('046fbf49bb8134c53d50595895283d4ce3b09473561219c6869ee2300af5481553e43d84d49837bd5a73fe6a3ab9337ef68532e1bf14ef83fb2d42eaa55c237680');
  });

  

});
