const MPT = require('../src/MPT')   // include MPT as DUT
const BRANCH = 'branch';
const EXTENSION = 'extension'
const LEAF = 'leaf'

test('constructor with default parameters', () => {
    let testingMPT = new MPT();
    expect(testingMPT.root).toEqual(false);
    expect(testingMPT.type).toEqual('account');
});

test('constructor with custom parameters', () => {
    let testingMPT = new MPT(true, 'receipt');
    expect(testingMPT.root).toEqual(true);
    expect(testingMPT.type).toEqual('receipt');
});

test('MPT.Insert() root -> leaf with default parameters', () => {
    let testingMPT = new MPT(true, 'account');
    testingMPT.Insert('h12345', 0);
    expect(testingMPT.root).toEqual(true);
    expect(testingMPT.type).toEqual('account');
    expect(testingMPT.key).toEqual('h12345');
    expect(testingMPT.value).toEqual([
        0, 0, 0
    ]);
});

test('MPT.Insert() root -> leaf with custom parameters', () => {
    let testingMPT = new MPT(true, 'account');
    testingMPT.Insert('h12345', 0, 3, 1);
    expect(testingMPT.root).toEqual(true);
    expect(testingMPT.type).toEqual('account');
    expect(testingMPT.key).toEqual('h12345');
    expect(testingMPT.value).toEqual([
        0, 3, 1
    ]);
});

test('MPT.Insert() leaf -> extension with default parameters', () => {
    // (before insert:) leaf
    // (after insert:) extension -> branch[5]
    //                              branch[8]
    let testingMPT = new MPT(true, 'account');
    testingMPT.Insert('12345', 0);
    testingMPT.Insert('12348', 0);
    expect(testingMPT.mode).toEqual(EXTENSION);
    expect(testingMPT.key).toEqual('1234');
    expect(testingMPT.value).toEqual(null);
    expect(testingMPT.next).not.toBeNull();         // shall exists

    nextNode = testingMPT.next;
    expect(nextNode.mode).toEqual(BRANCH);
    expect(nextNode.branch[5]).not.toBeNull();      // for h12345
    expect(nextNode.branch[8]).not.toBeNull();      // for h12348

    Node_h12345 = nextNode.branch[5];
    Node_h12348 = nextNode.branch[8];

    expect(Node_h12345.mode).toEqual(LEAF);
    expect(Node_h12345.key).toEqual('');
    expect(Node_h12345.value).toEqual([
        0, 0, 0
    ]);
    expect(Node_h12348.mode).toEqual(LEAF);
    expect(Node_h12348.key).toEqual('');
    expect(Node_h12348.value).toEqual([
        0, 0, 0
    ]);

    
});

test('MPT.Insert() leaf -> branch with default parameters', () => {
    // (before insert:) leaf
    // (after insert:) branch[1] -> leaf
    //                 branch[2] -> leaf
    let testingMPT = new MPT(true, 'account');
    testingMPT.Insert('12345', 7);
    testingMPT.Insert('22345', 11);
    expect(testingMPT.mode).toEqual(BRANCH);
    expect(testingMPT.branch[1]).not.toBeNull();    // shall exists
    expect(testingMPT.branch[2]).not.toBeNull();    // shall exists

    Node_12345 = testingMPT.branch[1];
    Node_22345 = testingMPT.branch[2];
    expect(Node_12345.mode).toEqual(LEAF);
    expect(Node_12345.key).toEqual('2345');
    expect(Node_12345.value).toEqual([
        7, 0, 0
    ]);
    expect(Node_22345.mode).toEqual(LEAF);
    expect(Node_22345.key).toEqual('2345');
    expect(Node_22345.value).toEqual([
        11, 0, 0
    ]);
    
});

test('MPT.Insert() branch -> ... with default parameters', () => {
    // (before insert:) branch
    // (after insert:) branch[1] -> leaf
    //                 branch[2] -> leaf
    //                 branch[3] -> leaf
    let testingMPT = new MPT(true, 'account');
    testingMPT.Insert('12345', 7);
    testingMPT.Insert('22345', 11);
    testingMPT.Insert('33456', 13);
    expect(testingMPT.mode).toEqual(BRANCH);
    expect(testingMPT.branch[1]).not.toBeNull();    // shall exists
    expect(testingMPT.branch[2]).not.toBeNull();    // shall exists
    expect(testingMPT.branch[3]).not.toBeNull();    // shall exists

    Node_33456 = testingMPT.branch[3];
    
    expect(Node_33456.mode).toEqual(LEAF);
    expect(Node_33456.key).toEqual('3456');
    expect(Node_33456.value).toEqual([
        13, 0, 0
    ]);
    
});

test('MPT.Insert() branch -> ... with default parameters', () => {
    // (after insert:) branch[1] -> leaf (2345)
    //                 branch[2] -> branch[2] -> leaf (345)
    //                              branch[2] self
    //                              branch[3] -> leaf (456)
    let testingMPT = new MPT(true, 'account');
    // setting up MPT
    testingMPT.Insert('12345', 7);
    testingMPT.Insert('22345', 11);
    testingMPT.Insert('23456', 13);

    // now insert new node for testing
    testingMPT.Insert('2', 15);
    expect(testingMPT.mode).toEqual(BRANCH);
    expect(testingMPT.branch[1]).not.toBeNull();    // shall exists
    expect(testingMPT.branch[2]).not.toBeNull();    // shall exists

    Node_2 = testingMPT.branch[2];                  // Node_2 should be branch

    expect(Node_2.mode).toEqual(BRANCH);
    expect(Node_2.value).toEqual([
        15, 0, 0
    ]);
    
});

test('MPT.Insert() extension -> ... with default parameters', () => {
    // (before insert)  extension (123) -> branch
    //                                       [4] -> leaf (5)
    //                                       [7] -> leaf (8)
    // (after insert)   branch
    //                    [1] -> extension (23) -> branch
    //                                               [4] -> leaf (5)
    //                                               [7] -> leaf (8)
    //                    [2] -> leaf (3456)

    let testingMPT = new MPT(true, 'account');
    // setting up MPT
    testingMPT.Insert('12345', 7);
    testingMPT.Insert('12378', 11);
    
    // now insert new node for testing
    testingMPT.Insert('23456', 15);
    expect(testingMPT.mode).toEqual(BRANCH);
    expect(testingMPT.branch[1]).not.toBeNull();    // shall exists
    expect(testingMPT.branch[2]).not.toBeNull();    // shall exists

    Node_EX_23 = testingMPT.branch[1];              // extension
    Node_LE_3456 = testingMPT.branch[2];            // leaf

    // test Node_EX_23
    expect(Node_EX_23.mode).toEqual(EXTENSION);
    expect(Node_EX_23.key).toEqual('23');
    expect(Node_EX_23.next).not.toBeNull();

    // test Node_LE_3456
    expect(Node_LE_3456.mode).toEqual(LEAF);
    expect(Node_LE_3456.key).toEqual('3456');
    expect(Node_LE_3456.value).toEqual([
        15, 0, 0
    ]);

    Node_BR_123 = Node_EX_23.next;                  // branch node
    expect(Node_BR_123.mode).toEqual(BRANCH);
    expect(Node_BR_123.branch[4]).not.toBeNull();   // shall exists
    expect(Node_BR_123.branch[7]).not.toBeNull();   // shall exists

    Node_LE_5 = Node_BR_123.branch[4];
    Node_LE_8 = Node_BR_123.branch[7];

    expect(Node_LE_5.mode).toEqual(LEAF);
    expect(Node_LE_5.key).toEqual('5');
    expect(Node_LE_5.value).toEqual([
        7, 0, 0
    ])
    expect(Node_LE_8.mode).toEqual(LEAF);
    expect(Node_LE_8.key).toEqual('8');
    expect(Node_LE_8.value).toEqual([
        11, 0, 0
    ])

    
});

test('MPT.Insert() extension -> ... with default parameters', () => {
    // (before insert)  extension (123) -> branch
    //                                       [4] -> leaf (5)
    //                                       [7] -> leaf (8)
    // insert: 12356
    // (after insert)   extension (123) -> branch
    //                                       [4] -> 5
    //                                       [5] -> 6
    //                                       [7] -> 8

    let testingMPT = new MPT(true, 'account');

     
    // setting up MPT and test before insertion
    testingMPT.Insert('12345', 7);
    testingMPT.Insert('12378', 11);
    expect(testingMPT.mode).toEqual(EXTENSION);
    expect(testingMPT.next).not.toBeNull();
    expect(testingMPT.key).toEqual('123')
    Node_BR_123 = testingMPT.next;
    expect(Node_BR_123.mode).toEqual(BRANCH)
    expect(Node_BR_123.branch[4]).not.toBeNull();
    expect(Node_BR_123.branch[7]).not.toBeNull();
    Node_LE_5 = Node_BR_123.branch[4];
    Node_LE_8 = Node_BR_123.branch[7];
    expect(Node_LE_5.mode).toEqual(LEAF)
    expect(Node_LE_5.key).toEqual('5')
    expect(Node_LE_5.value).toEqual([
        7, 0, 0
    ])
    expect(Node_LE_8.mode).toEqual(LEAF)
    expect(Node_LE_8.key).toEqual('8')
    expect(Node_LE_8.value).toEqual([
        11, 0, 0
    ])


    // now insert new node for testing
    testingMPT.Insert('12356', 15);
    expect(testingMPT.mode).toEqual(EXTENSION);
    expect(testingMPT.next).not.toBeNull();
    expect(testingMPT.key).toEqual('123');

    Node_BR_123 = testingMPT.next;
    expect(Node_BR_123.mode).toEqual(BRANCH)
    expect(Node_BR_123.branch[4]).not.toBeNull();
    expect(Node_BR_123.branch[5]).not.toBeNull();
    expect(Node_BR_123.branch[7]).not.toBeNull();

    Node_LE_5 = Node_BR_123.branch[4];
    Node_LE_6 = Node_BR_123.branch[5];
    Node_LE_8 = Node_BR_123.branch[7];
    expect(Node_LE_5.mode).toEqual(LEAF)
    expect(Node_LE_5.key).toEqual('5')
    expect(Node_LE_5.value).toEqual([
        7, 0, 0
    ])
    expect(Node_LE_6.mode).toEqual(LEAF)
    expect(Node_LE_6.key).toEqual('6')
    expect(Node_LE_6.value).toEqual([
        15, 0, 0
    ])
    expect(Node_LE_8.mode).toEqual(LEAF)
    expect(Node_LE_8.key).toEqual('8')
    expect(Node_LE_8.value).toEqual([
        11, 0, 0
    ])
    
});

test('MPT.Insert() extension -> ... with default parameters', () => {
    // (before insert)  extension (123) -> branch
    //                                       [4] -> leaf (5)
    //                                       [7] -> leaf (8)
    // insert: 12789
    // (after insert)   extension (12) -> branch
    //                                      [3] -> branch
    //                                             [4] -> leaf(5)
    //                                             [7] -> leaf(8)
    //                                      [7] -> leaf (89)

    let testingMPT = new MPT(true, 'account');

     
    // setting up MPT and test before insertion
    testingMPT.Insert('12345', 7);
    testingMPT.Insert('12378', 11);
    expect(testingMPT.mode).toEqual(EXTENSION);
    expect(testingMPT.next).not.toBeNull();
    expect(testingMPT.key).toEqual('123')
    Node_BR_123 = testingMPT.next;
    expect(Node_BR_123.mode).toEqual(BRANCH)
    expect(Node_BR_123.branch[4]).not.toBeNull();
    expect(Node_BR_123.branch[7]).not.toBeNull();
    Node_LE_5 = Node_BR_123.branch[4];
    Node_LE_8 = Node_BR_123.branch[7];
    expect(Node_LE_5.mode).toEqual(LEAF)
    expect(Node_LE_5.key).toEqual('5')
    expect(Node_LE_5.value).toEqual([
        7, 0, 0
    ])
    expect(Node_LE_8.mode).toEqual(LEAF)
    expect(Node_LE_8.key).toEqual('8')
    expect(Node_LE_8.value).toEqual([
        11, 0, 0
    ])


    // now insert new node for testing
    testingMPT.Insert('12789', 15);
    expect(testingMPT.mode).toEqual(EXTENSION);
    expect(testingMPT.next).not.toBeNull();
    expect(testingMPT.key).toEqual('12');

    Node_BR_12 = testingMPT.next;
    expect(Node_BR_12.mode).toEqual(BRANCH)
    expect(Node_BR_12.branch[3]).not.toBeNull();
    expect(Node_BR_12.branch[7]).not.toBeNull();

    Node_BR_123 = Node_BR_12.branch[3];
    Node_LE_89 = Node_BR_12.branch[7];

    expect(Node_BR_123.mode).toEqual(BRANCH)
    expect(Node_BR_123.branch[4]).not.toBeNull();
    expect(Node_BR_123.branch[7]).not.toBeNull();

    expect(Node_LE_89.mode).toEqual(LEAF)
    expect(Node_LE_89.key).toEqual('89')
    expect(Node_LE_89.value).toEqual([
        15, 0, 0
    ])

    Node_LE_5 = Node_BR_123.branch[4]
    Node_LE_8 = Node_BR_123.branch[7]

    expect(Node_LE_5.mode).toEqual(LEAF)
    expect(Node_LE_5.key).toEqual('5')
    expect(Node_LE_5.value).toEqual([
        7, 0, 0
    ])
    expect(Node_LE_8.mode).toEqual(LEAF)
    expect(Node_LE_8.key).toEqual('8')
    expect(Node_LE_8.value).toEqual([
        11, 0, 0
    ])
    
});

test('MPT.Insert() extension -> ... with default parameters', () => {
    // (before insert)  extension (123) -> branch
    //                                       [4] -> leaf (5)
    //                                       [7] -> leaf (8)
    // insert: 14567
    // (after insert)   extension (1) -> branch
    //                                     [2] -> extension (3) -> branch
    //                                                               [4] -> leaf (5)
    //                                                               [7] -> leaf (8)
    //                                     [4] -> leaf (567)

    let testingMPT = new MPT(true, 'account');

     
    // setting up MPT and test before insertion
    testingMPT.Insert('12345', 7);
    testingMPT.Insert('12378', 11);
    expect(testingMPT.mode).toEqual(EXTENSION);
    expect(testingMPT.next).not.toBeNull();
    expect(testingMPT.key).toEqual('123')
    Node_BR_123 = testingMPT.next;
    expect(Node_BR_123.mode).toEqual(BRANCH)
    expect(Node_BR_123.branch[4]).not.toBeNull();
    expect(Node_BR_123.branch[7]).not.toBeNull();
    Node_LE_5 = Node_BR_123.branch[4];
    Node_LE_8 = Node_BR_123.branch[7];
    expect(Node_LE_5.mode).toEqual(LEAF)
    expect(Node_LE_5.key).toEqual('5')
    expect(Node_LE_5.value).toEqual([
        7, 0, 0
    ])
    expect(Node_LE_8.mode).toEqual(LEAF)
    expect(Node_LE_8.key).toEqual('8')
    expect(Node_LE_8.value).toEqual([
        11, 0, 0
    ])


    // now insert new node for testing
    testingMPT.Insert('14567', 15);
    expect(testingMPT.mode).toEqual(EXTENSION);
    expect(testingMPT.next).not.toBeNull();
    expect(testingMPT.key).toEqual('1');

    Node_BR_1 = testingMPT.next;
    expect(Node_BR_1.mode).toEqual(BRANCH)
    expect(Node_BR_1.branch[2]).not.toBeNull();
    expect(Node_BR_1.branch[4]).not.toBeNull();

    Node_EX_3 = Node_BR_1.branch[2];
    Node_LE_567 = Node_BR_1.branch[4];

    // Node_EX_3
    expect(Node_EX_3.mode).toEqual(EXTENSION);
    expect(Node_EX_3.key).toEqual('3');
    expect(Node_EX_3.next).not.toBeNull();
    // Node_LE_567
    expect(Node_LE_567.mode).toEqual(LEAF)
    expect(Node_LE_567.key).toEqual('567')
    expect(Node_LE_567.value).toEqual([
        15, 0, 0
    ])

    Node_BR_123 = Node_EX_3.next
    expect(Node_BR_123.mode).toEqual(BRANCH)
    expect(Node_BR_123.branch[4]).not.toBeNull();
    expect(Node_BR_123.branch[7]).not.toBeNull();

    Node_LE_5 = Node_BR_123.branch[4]
    Node_LE_8 = Node_BR_123.branch[7]

    expect(Node_LE_5.mode).toEqual(LEAF)
    expect(Node_LE_5.key).toEqual('5')
    expect(Node_LE_5.value).toEqual([
        7, 0, 0
    ])
    expect(Node_LE_8.mode).toEqual(LEAF)
    expect(Node_LE_8.key).toEqual('8')
    expect(Node_LE_8.value).toEqual([
        11, 0, 0
    ])
    
});

test('MPT.Insert() extension -> ... with default parameters', () => {
    // (before insert)  extension (1) -> branch
    //                                     [2] -> leaf (345)
    //                                     [3] -> leaf (456)
    // insert: 23456
    // (after insert)   branch
    //                    [1] -> branch
    //                             [2] -> leaf (345)
    //                             [3] -> leaf (456)
    //                    [2] -> leaf (3456)

    let testingMPT = new MPT(true, 'account');

     
    // setting up MPT and test before insertion
    testingMPT.Insert('12345', 7);
    testingMPT.Insert('13456', 11);
    expect(testingMPT.mode).toEqual(EXTENSION);
    expect(testingMPT.next).not.toBeNull();
    expect(testingMPT.key).toEqual('1')
    Node_BR_1 = testingMPT.next;
    expect(Node_BR_1.mode).toEqual(BRANCH)
    expect(Node_BR_1.branch[2]).not.toBeNull();
    expect(Node_BR_1.branch[3]).not.toBeNull();
    Node_LE_345 = Node_BR_1.branch[2];
    Node_LE_456 = Node_BR_1.branch[3];
    expect(Node_LE_345.mode).toEqual(LEAF)
    expect(Node_LE_345.key).toEqual('345')
    expect(Node_LE_345.value).toEqual([
        7, 0, 0
    ])
    expect(Node_LE_456.mode).toEqual(LEAF)
    expect(Node_LE_456.key).toEqual('456')
    expect(Node_LE_456.value).toEqual([
        11, 0, 0
    ])


    // now insert new node for testing
    testingMPT.Insert('23456', 15);
    expect(testingMPT.mode).toEqual(BRANCH);
    expect(testingMPT.branch[1]).not.toBeNull();
    expect(testingMPT.branch[2]).not.toBeNull();

    Node_BR_1 = testingMPT.branch[1];
    Node_LE_3456 = testingMPT.branch[2];
    // Node_BR_1
    expect(Node_BR_1.mode).toEqual(BRANCH)
    expect(Node_BR_1.branch[2]).not.toBeNull();
    expect(Node_BR_1.branch[3]).not.toBeNull();
    // Node_LE_3456
    expect(Node_LE_3456.mode).toEqual(LEAF);
    expect(Node_LE_3456.key).toEqual('3456');
    expect(Node_LE_3456.value).toEqual([
        15, 0, 0
    ]);

    Node_LE_345 = Node_BR_1.branch[2];
    Node_LE_456 = Node_BR_1.branch[3];

    // Node_LE345
    expect(Node_LE_345.mode).toEqual(LEAF);
    expect(Node_LE_345.key).toEqual('345');
    expect(Node_LE_345.value).toEqual([
        7, 0, 0
    ]);
    // Node_LE_456
    expect(Node_LE_456.mode).toEqual(LEAF);
    expect(Node_LE_456.key).toEqual('456');
    expect(Node_LE_456.value).toEqual([
        11, 0, 0
    ]); 
});

test('MPT.Search()', () => {
    // test case for search
    // extension (1) -> branch
    //                   [2] -> extension (3) -> branch
    //                                             [4] -> leaf (5)
    //                                             [7] -> leaf (8)
    //                   [4] -> leaf (567)
    // Search for 
    //      12345
    //      12378
    //      14567
    //
    //      12245 (should return Null)
    //      13456 (should return Null)
    //      14577 (should return Null)
    let testingMPT = new MPT(true, 'account');
    testingMPT.Insert('12345', 7);
    testingMPT.Insert('12378', 11);
    testingMPT.Insert('14567', 15);
    expect(testingMPT.Search('12345')).toEqual([
        7, 0, 0
    ]);
    expect(testingMPT.Search('12378')).toEqual([
        11, 0, 0
    ]);
    expect(testingMPT.Search('14567')).toEqual([
        15, 0, 0
    ]);
    expect(testingMPT.Search('12245')).toBeNull();
    expect(testingMPT.Search('13456')).toBeNull();
    expect(testingMPT.Search('14577')).toBeNull();
});
