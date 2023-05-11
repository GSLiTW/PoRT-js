const sha256 = require('sha256');
const cloneDeep = require('lodash.clonedeep');
/** PoRT constructor. It will select the next maintainer for the next next block.
* @param  {list} address - all maintainer address in this round
* @param {MPT} MPT
*/
function PoRT(address, MPT) {
  this.address = cloneDeep(address),
  this.Tree = cloneDeep(MPT);
  this.nextMaintainer = [];

  for (let i = 0; i < address.length; i++) {
    const T = this.Tree.TotalTax().toString();
    const tmp = sha256(T + this.address[i]);
    const h = parseInt(tmp, 16) % T;
    let flag = 0;
    let getMaintainer = null;
    const taxcnt = 0;
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
