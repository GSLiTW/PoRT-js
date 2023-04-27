// data structure for pending txns
const elliptic = require('elliptic');
const Transaction_MT = require('./transaction');
const ecdsa = new elliptic.ec('secp256k1');

/**
 * Generate & Initialize Transaction Pool
 * @class  Transaction Pool of the Blockchain containing transactions that had not been mined/added to blockchain
 * @param  {Array} tx
 */
function Pending_Transaction_Pool(tx = []) {
  this.transactions = tx;
};

/**
 * Clear the transaction pool
 */
Pending_Transaction_Pool.prototype.clean = function() {
  this.transactions = [];
};

/**
 * Get all the transactions in transaction pool
 * @return {Array} all transactions in transaction pool
 */
Pending_Transaction_Pool.prototype.get_transaction = function() {
  return this.transactions;
};

/**
 * Get length of the transaction pool
 * @return {Number} quantity of transaction in transaction pool 
 */
Pending_Transaction_Pool.prototype.get_num_of_transaction = function() {
  return this.transactions.length;
};

/**
 * Check if there are the same transaction in the transaction pool
 * @param  {Transaction_MT} tx
 * @return {boolean} 
 */
Pending_Transaction_Pool.prototype.isRepeat = function(tx) {
  if (this.transactions.filter((e) => e.id === tx.id).length > 0) {
    return true;
  } else {
    return false;
  }
};

/**
 * Validate if the transaction is legal or not
 * @param  {Transaction_MT} tx
 * @return {boolean} 
 */
Pending_Transaction_Pool.prototype.validate = function(tx) {
  if (tx.value < 0 || !Number.isInteger(tx.value)) {
    console.log('value fail')
    return false;
  }

  const hexToDecimal = (x) => ecdsa.keyFromPrivate(x, 'hex').getPrivate().toString(10);
  try{
    const pubkey = ecdsa.recoverPubKey(
        hexToDecimal(tx.id.substr(2)), tx.sig, tx.sig.recoveryParam, 'hex');
  }
  catch(e){
    console.log('verifyfail');
    return false;
  }
  // if (!pubkey) {
  //   console.log('verifyfail');
  //   return false;
  // }
  return true;
};

/**
 * Check and add a single transaction to transaction pool
 * @param  {Transaction_MT} tx
 */
Pending_Transaction_Pool.prototype.addTx = function(tx) {
  if (Pending_Transaction_Pool.prototype.validate.call(this, tx) && !Pending_Transaction_Pool.prototype.isRepeat.call(this, tx)) {
    this.transactions.push(tx);
  }
};

/**
 * Check and add multiple transactions to transaction pool
 * @param  {Array} txs
 */
Pending_Transaction_Pool.prototype.addTxs = function(txs) {
  txs.forEach((tx) => {
    Pending_Transaction_Pool.prototype.addTx.call(this, tx);
  });
};

/**
 * Remove specific transaction from transaction pool
 * @param  {Transaction_MT} tx
 */
Pending_Transaction_Pool.prototype.remove = function(tx) {
  this.transactions.forEach((element, index) => {
    if (tx.id === element.id) {
      this.transactions.splice(index, 1);
    }
  });
};

module.exports = Pending_Transaction_Pool;
