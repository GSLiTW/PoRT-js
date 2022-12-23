const sha256 = require('sha256');
/** PoRT constructor.
* @param  {list} address - root address
* @param {MPT} MPT
* @param {string} dbit - root dbit
*/
function PoRT(address, MPT) {
  this.address = address,
  this.Tree = MPT;
  this.nextMaintainer = [];
  const T = this.Tree.TotalTax().toString();

  for (let i = 0; i < address.length; i++) {
    const tmp = sha256(T + this.address[i]);
    const h = parseInt(tmp, 16) % T;
    let flag = 0;
    let getMaintainer = null;
    let taxcnt = 0;
    while (!flag) {
      getMaintainer = this.Tree.Select(h, flag, this.Tree, taxcnt);
      flag = getMaintainer[0];
      taxcnt = getMaintainer[2];
      if (flag) {
        for (let j = 0; j < this.nextMaintainer.length; j++) {
          if (this.nextMaintainer[j] === getMaintainer[1]) {
            flag = 0;
            break;
          }
        }
      }
    }
    this.nextMaintainer.push(getMaintainer[1]);
  }
}
module.exports = PoRT;
