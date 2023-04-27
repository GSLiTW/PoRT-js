const MPT = require("../MPT/MPT");

/**
 * @class Data Structure for a single transaction
 * @param  {string} id - Transaction Hash
 * @param  {string} sender - Sender's public key/ address
 * @param  {string} receiver - Receiver's public key/ address
 * @param  {float} value - Transaction value
 */
function Transaction_MT(id, sender, receiver, value, sig, MPT) {
  this.id = id;
  this.sender = sender;
  this.receiver = receiver;
  //this.value = Math.round(value * 1000000000000);// since 10^18 will overflow (limit: 10^16), use 10^12 temporarily instead.
  this.value = value;
  this.sig = sig;
  this.accountCheck(sender, MPT);
  this.accountCheck(receiver, MPT);
}

/**
 * Check if the given key has the account registered in MPT, if no register one
 * @param  {string} key
 * @param  {MPT} MPT
 */
Transaction_MT.prototype.accountCheck = function(key, MPT) {
  if (MPT.Search(key) === undefined || MPT.Search(key) === null) {
    MPT.Insert(key, 0);
  }
};

/**
 * Get Id of the transaction
 * @return {string} Id of the transaction
 */
Transaction_MT.prototype.get_id = function() {
  return this.id;
};

/**
 * Get Sender of the transaction
 * @return {string} Sender of the transaction
 */
Transaction_MT.prototype.get_sender = function() {
  return this.sender;
};

/**
 * Get Receiver of the transaction
 * @return {string} Receiver of the transaction
 */
Transaction_MT.prototype.get_receiver = function() {
  return this.receiver;
};

/**
 * Get Value of the transaction
 * @return {float} Value of the transaction
 */
Transaction_MT.prototype.get_value = function() {
  return this.value;
};

module.exports = Transaction_MT;
