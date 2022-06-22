const Branch = require('../src/MPT_Branch')   // include MPT_Branch as DUT
const BRANCH = 'branch';
const EXTENSION = 'extension'
const LEAF = 'leaf'

test('#T001 constructor with default parameters', () => {
    let testingBranch = new Branch();
    expect(testingBranch.root).toEqual(false);
    expect(testingBranch.type).toEqual('account');
});
