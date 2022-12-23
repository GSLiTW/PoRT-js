const sha256 = require('sha256');
const cloneDeep = require('lodash.clonedeep');
/** PoRT constructor.
* @param  {list} address - root address
* @param {MPT} MPT
* @param {string} dbit - root dbit
*/
function PoRT(address, MPT) {
  this.address = cloneDeep(address),
  this.Tree = cloneDeep(MPT);
  this.nextMaintainer = [];

  for (let i = 0; i < address.length; i++) {
    let T = this.Tree.TotalTax().toString();
    let tmp = sha256(T + this.address[i]);
    let h = parseInt(tmp, 16) % T;
    let flag = 0;
    let getMaintainer = null;
    let taxcnt = 0;
    while (!flag) {
      getMaintainer = this.Tree.Select(h, 0, taxcnt);
      flag = getMaintainer[0];
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
    this.Tree.UpdateDbit(getMaintainer[1], [1, 1]);
    console.log('select: '+i);
  }
}
module.exports = PoRT;
