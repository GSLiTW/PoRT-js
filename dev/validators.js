function Validators(address) {
    this.list = [];
};

Validators.prototype.update = function(transaction) {
    if (transaction.amount == 30 && transaction.to == "0") {
        this.list.push(transaction.from);
        return true;
    }
    return false;
}
  
module.exports = Validators;