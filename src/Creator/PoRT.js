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
    const T = this.Tree.TotalTax().toString();
    const tmp = sha256(T + this.address[i]);
    // console.log(tmp);
    const h = parseInt(tmp, 16) % T;
    let flag = 0;
    let getMaintainer = null;
    let taxcnt = 0;
    while (!flag) {
      getMaintainer = this.Tree.Select(h, 0, this.Tree, taxcnt);
      flag = getMaintainer[0];
      taxcnt = getMaintainer[2] % h;
      console.log(getMaintainer);
      // console.log(taxcnt);
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
    this.Tree.RefundTax(getMaintainer[1], this.Tree.Search(getMaintainer[1].toString('hex')).Tax());
    console.log('c-6-' + i);
    // console.log(this.Tree);
  }
}
module.exports = PoRT;
