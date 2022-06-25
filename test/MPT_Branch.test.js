const Branch = require('../src/MPT_Branch');   // include MPT_Branch as DUT
const Leaf = require('../src/MPT_Leaf');
const BRANCH = 'branch';
const EXTENSION = 'extension'
const LEAF = 'leaf'

test('#T001 constructor with default parameters', () => {
    let testingBranch = new Branch();
    expect(testingBranch.root).toEqual(false);
    expect(testingBranch.type).toEqual('account');
});

test('#T002 constructor with custom parameters', () => {
    let testingBranch = new Branch(true, 'receipt');
    expect(testingBranch.root).toEqual(true);
    expect(testingBranch.type).toEqual('receipt');
});

test('#T003 Branch.Insert', () => {
    // test case for Insert()
    // branch
    //   [1] -> branch
    //            [2] -> branch
    //                     [3] -> branch 
    //                              [4] -> branch
    //                                       [5] leaf [] (7, 0, 0)
    //                                       [3] leaf [] (9, 0, 0)
    //                     [4] -> branch
    //                              [5] -> branch
    //                                       [6] leaf [] (11, 0, 0)
    let testingTree = new Leaf();
    testingTree = testingTree.Insert('12345', 7);
    console.log(testingTree);
    testingTree = testingTree.Insert('12343', 9);
    testingTree = testingTree.Insert('12343', 11);

    /*
    let testingBranch = new Branch();
    testingBranch = testingBranch.Insert('12345', 7);
    console.log(testingBranch);
    console.log(testingBranch.branch[1].Value());
    testingBranch = testingBranch.Insert('12343', 9);
    testingBranch = testingBranch.Insert('12456', 11);
    */

    Node_12345 = testingTree.branch[1].branch[2].branch[3].branch[4].branch[5];
    Node_12343 = testingTree.branch[1].branch[2].branch[3].branch[4].branch[3];
    Node_12456 = testingTree.branch[1].branch[2].branch[4].branch[5].branch[6];

    expect(Node_12345.Value()).toEqual([
        7, 0, 0
    ]);
    expect(Node_12343.Value()).toEqual([
        9, 0, 0
    ]);
    expect(Node_12456.Value()).toEqual([
        11, 0, 0
    ]);


    
});