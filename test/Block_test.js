test("#BLOCK_test: func", () => {
  const blockchain = require("../src/Block/blockchain");
  const Block = require("../src/Block/block");
  const MPT = require("../src/MPT/MPT");

  const Txn_Pool = require("../src/Transaction/pending_transaction_pool");
  const Creator = require("../src/Creator/Creator");
  const fs = require("fs");
  const Cosig = require("../src/cosig.js");
  const T = new MPT();
  const Bchain = new blockchain(T);
  const data = fs
    .readFileSync("./data/node_address_mapping_table.csv")
    .toString() // convert Buffer to string
    .split("\n") // split string to lines
    .map((e) => e.trim()) // remove white spaces for each line
      .map((e) => e.split(',').map((e) => e.trim())); // split each line to array

  Bchain.txn_pool = new Txn_Pool();
  Bchain.txn_pool.create(1, T);

  for (let i = 0; i < 157; i++) {
    if (i == 2) T.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 1]);
    // dbit == 1 means creator
    else if (i == 4)
      T.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]);
    // dbit == 2 means voter
    else if (i == 6)
      T.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]);
    // dbit == 2 means voter
    else if (i == 8)
      T.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [2, 2]);
    // dbit == 2 means voter
    else T.Insert(data[i][2], 1000000000, 1000000000 * 0.0001, [0, 0]);
  }

  Bchain.chain = [];

  let genesisData;
  const dataFile = fs.readFileSync("./src/Block/genesisBlock.json");
  try {
    genesisData = JSON.parse(dataFile);
    //console.log("JSON string:", "utf8", genesisData);
  } catch (err) {
    console.log("Error parsing JSON string:", err);
  }
  const genesisBlock = new Block(
    1, // height
    Bchain.txn_pool.transactions,
    0, // previous Hash
    T
  );
  genesisBlock.timestamp = genesisData.timestamp;
  genesisBlock.hash = genesisData.hash;
  genesisBlock.nextCreator = genesisData.nextCreator;
  genesisBlock.nextVoters = genesisData.nextVoters;
  Bchain.chain.push(genesisBlock);

  // create Genesis Block
  console.log(
    Bchain.getTransaction(
      "0x43a1a360188faaa2b227c1133d66e155c240816b33d6cba682e9ab27dbc77012"
    )
  );
  // expect().toMatchObject({
  //   block: 1,
  //   transaction: 0x43a1a360188faaa2b227c1133d66e155c240816b33d6cba682e9ab27dbc77012,
  // });
});

