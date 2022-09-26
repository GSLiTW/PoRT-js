const sha256 = require('sha256');
/** PoRT constructor.
* @param  {string} address - root address
* @param {MPT} MPT
* @param {string} dbit - root dbit
*/
function PoRT(address, MPT, dbit) {
  this.address = address,
  this.Tree = MPT,
  this.dbit = dbit; // 1 for creator, 2 for voter

  const T = this.Tree.TotalTax().toString();
  const tmp = sha256(T + this.address);
  const h = parseInt(tmp, 16) % T;
  const getMaintainer = this.Tree.Select(h, 0, 0);
  this.nextMaintainer = getMaintainer[1];
  // this.Tree.UpdateDbit(this.address, [0, 0]);
  // this.Tree.UpdateDbit(this.nextMaintainer, this.dbit);
}
module.exports = PoRT;
