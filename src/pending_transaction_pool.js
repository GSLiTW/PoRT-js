// data structure for pending txns
const CSV_data = require('./CSV_data.js');
const Transaction_MT = require('./transaction.js');

function Pending_Transaction_Pool(tx = []) {
  this.transactions = tx;
};

Pending_Transaction_Pool.prototype.create = function(num) {
  const data = new CSV_data();
  const data_ = data.getData(num); // get data of block1
  if (num == 1 || num == 2) {
    Pending_Transaction_Pool.prototype.addTxs.call(this, Pending_Transaction_Pool.prototype.insertCSVData.call(this, 44, data_));
  } else if (num == 3) {
    Pending_Transaction_Pool.prototype.addTxs.call(this, Pending_Transaction_Pool.prototype.insertCSVData.call(this, 50, data_));
  } else console.log('wrong block number.');
};

Pending_Transaction_Pool.prototype.insertCSVData = function(quantity, data) {
  txns = [];
  for (let i = 1; i < quantity; i++) {
    txns.push(new Transaction_MT(data[i][0], data[i][2], data[i][3], data[i][4]));
  }
  return txns;
};

Pending_Transaction_Pool.prototype.clean = function() {
  this.transactions = [];
};

Pending_Transaction_Pool.prototype.get_transaction = function() {
  return this.transactions;
};

Pending_Transaction_Pool.prototype.get_num_of_transaction = function() {
  return this.transactions.length;
};

Pending_Transaction_Pool.prototype.isRepeat = function(tx){
  this.transactions.forEach((element) => {
    if (tx.id === element.id) {
      return true;
    }
  });
  return false;
};

Pending_Transaction_Pool.prototype.validate = function (tx) {
  if (tx.value < 0) {
    return false;
  }

  return true;
};

Pending_Transaction_Pool.prototype.addTx = function(tx) {
  if (Pending_Transaction_Pool.prototype.validate.call(this, tx) && !Pending_Transaction_Pool.prototype.isRepeat.call(this, tx)) {
    this.transactions.push(tx);
  }
};

Pending_Transaction_Pool.prototype.addTxs = function(txs) {
  txs.forEach((tx) => {
    Pending_Transaction_Pool.prototype.addTx.call(this, tx);
  });
};

Pending_Transaction_Pool.prototype.remove = function(tx) {
  this.transactions.forEach((element, index) => {
    if (tx.id === element.id) {
      this.transactions.splice(index, 1);
    }
  });
};

module.exports = Pending_Transaction_Pool;
