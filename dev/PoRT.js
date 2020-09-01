const MPT = require("./MPT");
const Pending_Transaction_Pool = require("./pending_transaction_pool.js");
const sha256 = require("sha256");

function PoRT(address, MPT, pending_txn_pool, dbit) {
    this.address = address,
    this.Tree = MPT,
    this.Pending_Txn_Pool = pending_txn_pool
    this.dbit = dbit // 1 for creator, 2 for voter


    // 先把txn跑一遍, 把原本不在mapping_table中的node insert進去, tax一樣設10 * 0.0001
    var num_of_txns = this.Pending_Txn_Pool.get_num_of_transaction();
    for(var i = 0; i < num_of_txns; i++) {
        this.Tree.Insert(this.Pending_Txn_Pool.transactions[i].sender, 10, 0.0001)
        this.Tree.Insert(this.Pending_Txn_Pool.transactions[i].receiver, 10, 0.0001)
    }

    for(var i = 0; i < num_of_txns; i++) {
        this.Tree.UpdateTax(this.Pending_Txn_Pool.transactions[i].sender, this.Pending_Txn_Pool.transactions[i].value * 0.0001);
        this.Tree.UpdateTax(this.Pending_Txn_Pool.transactions[i].receiver, this.Pending_Txn_Pool.transactions[i].value * 0.0001);
    }

    var T = Tree.TotalTax().toString();
    var tmp = sha256(T + this.address);
    var h = parseInt(tmp, 16) % T;
    var next_maintainer = Tree.Select(h, 0, 0);
    //console.log(next_maintainer);
    this.Tree.UpdateDbit(next_maintainer, this.dbit);

}
module.exports = PoRT;