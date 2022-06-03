/**
 * Constructor of the NodeVal Class
 * @class Data Structure for value of MPT node
 * @param  {Number} [value=0]
 * @param  {Number} [tax=0]
 * @param  {integer={0, 1, 2}} [Dbit=0]
 */
function NodeVal(value = 0, tax = 0, DirtyBit = 0) {
    this.value = value;
    this.tax = tax;
    this.DirtyBit = DirtyBit;
};

NodeVal.prototype.Value = function() {
    return this.value;
};

NodeVal.prototype.Tax = function() {
    return this.tax;
};

NodeVal.prototype.Dbit = function() {
    return this.DirtyBit;
};

NodeVal.prototype.SetValue = function(value) {
    this.value = value;
};

NodeVal.prototype.SetTax = function(tax) {
    this.tax = tax;
};

NodeVal.prototype.SetDbit = function(Dbit) {
    this.DirtyBit = Dbit;
};

module.exports = NodeVal;