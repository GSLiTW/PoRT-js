const sha256 = require('sha256');
/** PoRT constructor.
* @param  {string} address - root address
* @param {MPT} MPT
* @param {string} dbit - root dbit
*/
function PoRT(address, MPT) {
  this.address = address,
  this.Tree = MPT;
  const T = this.Tree.TotalTax().toString();
  const tmp = sha256(T + this.address);
  const h = parseInt(tmp, 16) % T;
  let flag = 0;
  let getMaintainer = null;
  let taxcnt = 0;
  while (!flag) {
    getMaintainer = this.Tree.Select(h, flag, taxcnt);
    flag = getMaintainer[0];
    taxcnt = getMaintainer[1];
  }

  this.nextMaintainer = getMaintainer[1];
}
module.exports = PoRT;
