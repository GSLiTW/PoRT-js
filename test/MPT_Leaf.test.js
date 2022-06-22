const Leaf = require('../src/MPT_Leaf')     // include MPT_Leaf as DUT
const BRANCH = 'branch';
const EXTENSION = 'extension'
const LEAF = 'leaf'

test('#T001 constructor with default parameters', () => {
    let testingLeaf = new Leaf();
    expect(testingLeaf.root).toEqual(false);
    expect(testingLeaf.type).toEqual('account');
});

test('#T002 constructor with custom parameters', () => {
    let testingLeaf = new Leaf(false, 'receipt');
    expect(testingLeaf.root).toEqual(false);
    expect(testingLeaf.type).toEqual('receipt');
});

