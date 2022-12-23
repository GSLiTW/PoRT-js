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
      console.log('taxcnt: '+taxcnt);
      getMaintainer = this.Tree.Select(h, 0, this.Tree, taxcnt);
      flag = getMaintainer[0];
      taxcnt = getMaintainer[2];
      if (flag) {
        console.log('h: '+h);
        console.log(getMaintainer);
        taxcnt = (-1)*taxcnt;
        for (let j = 0; j < this.nextMaintainer.length; j++) {
          if (this.nextMaintainer[j] === getMaintainer[1]) {
            flag = 0;
            break;
          }
        }
      }
    }
    this.nextMaintainer.push(getMaintainer[1]);
    console.log(this.Tree.Search(getMaintainer[1].toString('hex')).Dbit());
    this.Tree.UpdateDbit(getMaintainer[1], [1, 1]);
    console.log(this.Tree.Search(getMaintainer[1].toString('hex')).Dbit());
    console.log('select: '+i);
  }
}
module.exports = PoRT;
