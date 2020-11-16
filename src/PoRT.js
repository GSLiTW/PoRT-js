const sha256 = require("sha256");

function PoRT(address, MPT, dbit) {
    this.address = address,
    this.Tree = MPT,
    this.dbit = dbit // 1 for creator, 2 for voter

    var T = this.Tree.TotalTax().toString();
    var tmp = sha256(T + this.address);
    var h = parseInt(tmp, 16) % T;
    this.next_maintainer = this.Tree.Select(h, 0, 0);
    this.Tree.UpdateDbit(this.next_maintainer, this.dbit);
}
module.exports = PoRT;