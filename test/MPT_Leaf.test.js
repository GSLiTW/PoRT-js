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

test('#T003 Insert()', () => {
    let testingLeaf = new Leaf();
    testingLeaf.Insert('12345', 5, 2, 1);
    console.log(testingLeaf);
    expect(testingLeaf.value.Value()).toEqual([
        5, 2, 1
    ]);
    expect(testingLeaf.Insert('12345')).toBeNull();
});
