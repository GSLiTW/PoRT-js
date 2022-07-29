/**
 * Constructor of the NodeVal Class
 * @class Data Structure for value of MPT node
 * @param  {Number} [balance=0]
 * @param  {Number} [tax=0]
 * @param  {string={'00', '11', '12', '21', '22'}} [Dbit='00']
 */
function NodeVal(balance = 0, tax = 0, DirtyBit = '00') {
  this.balance = balance;
  this.tax = tax;
  this.DirtyBit = DirtyBit;
};

NodeVal.prototype.Balance = function() {
  return this.balance;
};

NodeVal.prototype.Tax = function() {
  return this.tax;
};

NodeVal.prototype.Dbit = function() {
  return this.DirtyBit;
};

NodeVal.prototype.Value = function() {
  return [this.balance, this.tax, this.DirtyBit];
};

NodeVal.prototype.SetBalance = function(balance) {
  this.balance = balance;
};

NodeVal.prototype.SetTax = function(tax) {
  this.tax = tax;
};

NodeVal.prototype.SetDbit = function(Dbit) {
  this.DirtyBit = Dbit;
};

NodeVal.prototype.SetValue = function(balance, tax, Dbit) {
  this.balance = balance;
  this.tax = tax;
  this.DirtyBit = Dbit;
};

module.exports = NodeVal;
