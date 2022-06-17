const MPT = require('../src/MPT')   // include MPT as DUT
const BRANCH = 'branch';
const EXTENSION = 'extension'
const LEAF = 'leaf'
const TAX_RATIO = 0.0001

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

test('MPT.Insert() insert existed key', () => {
    // (before insert:) leaf
    // (after insert:) extension -> branch[5]
    //                              branch[8]
    let testingMPT = new MPT(true, 'account');
    testingMPT.Insert('12345', 0);
    expect(testingMPT.Insert('12345', 0)).toBeNull();   // insert existed key

    
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

test('MPT.Insert() insert with type = tx', () => {
    // (before insert:) leaf
    // (after insert:) extension -> branch[5]
    //                              branch[8]
    let testingMPT = new MPT(true, 'tx');
    testingMPT.Insert('12345', 0);
    expect(testingMPT.Insert('12345', 1)).toBeNull();

    
});

test('MPT.Search() with type = account', () => {
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

test('MPT.Search() with type = receipt', () => {
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
    //      12345 (should return Null)
    //      12378 (should return Null)
    //      14567 (should return Null)
    let testingMPT = new MPT(true, 'receipt');
    testingMPT.Insert('12345', 7);
    testingMPT.Insert('12378', 11);
    testingMPT.Insert('14567', 15);
    expect(testingMPT.Search('12345')).toBeNull();
    expect(testingMPT.Search('12378')).toBeNull();
    expect(testingMPT.Search('14567')).toBeNull();
});

test('MPT.ModifyValue()', () => {
    // test case for search
    // extension (1) -> branch
    //                   [2] -> extension [3] -> branch
    //                                             [4] -> leaf [5] (7)
    //                                             [7] -> leaf [8] (11)
    //                   [4] -> leaf [567] (15)
    // Try increase (should success)
    //      12345 +(17)
    //      12378 + (2)
    //      14567 + (5)
    //
    // Try decrease (should success)
    //      12345 - (5)
    //      12378 - (2)
    //      14567 - (1)
    // Try decrease (should fail)
    //      12345 -(31)
    //      12378 -(25)
    //      14567 -(19)
    // Try invalid modify flag (should fail)
    //      12345 * (17)
    //      12345 k (15)
    //      12345 ! (3)
    // Try decrease inexisted address (should fail)
    //      13456 - (5)
    //      12357 - (7)
    //      12257 - (7)

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

    // Try increase (should success)
    expect(testingMPT.ModifyValue('12345', '+', 17)).not.toBeNull();
    expect(testingMPT.ModifyValue('12378', '+', 2)).not.toBeNull();
    expect(testingMPT.ModifyValue('14567', '+', 5)).not.toBeNull();
    expect(testingMPT.Search('12345')).toEqual([
        24, 0, 0
    ]);
    expect(testingMPT.Search('12378')).toEqual([
        13, 0, 0
    ]);
    expect(testingMPT.Search('14567')).toEqual([
        20, 0, 0
    ]);
    // Try decrease (should success)
    expect(testingMPT.ModifyValue('12345', '-', 5)).not.toBeNull();
    expect(testingMPT.ModifyValue('12378', '-', 2)).not.toBeNull();
    expect(testingMPT.ModifyValue('14567', '-', 1)).not.toBeNull();
    expect(testingMPT.Search('12345')).toEqual([
        24 - 5 * (1 + TAX_RATIO), 5 * TAX_RATIO, 0
    ]);
    expect(testingMPT.Search('12378')).toEqual([
        13 - 2 * (1 + TAX_RATIO), 2 * TAX_RATIO, 0
    ]);
    expect(testingMPT.Search('14567')).toEqual([
        20 - 1 * (1 + TAX_RATIO), 1 * TAX_RATIO, 0
    ]);

    // Try decrease (should fail)
    expect(testingMPT.ModifyValue('12345', '-', 31)).toBeNull();
    expect(testingMPT.ModifyValue('12378', '-', 25)).toBeNull();
    expect(testingMPT.ModifyValue('14567', '-', 19)).toBeNull();
    // After Failure, value should not be changed
    expect(testingMPT.Search('12345')).toEqual([
        24 - 5 * (1 + TAX_RATIO), 5 * TAX_RATIO, 0
    ]);
    expect(testingMPT.Search('12378')).toEqual([
        13 - 2 * (1 + TAX_RATIO), 2 * TAX_RATIO, 0
    ]);
    expect(testingMPT.Search('14567')).toEqual([
        20 - 1 * (1 + TAX_RATIO), 1 * TAX_RATIO, 0
    ]);

    // Try invalid modify flag (should fail) 
    expect(testingMPT.ModifyValue('12345', '*', 17)).toBeNull();
    expect(testingMPT.ModifyValue('12345', 'k', 15)).toBeNull();
    expect(testingMPT.ModifyValue('12345', '!', 3)).toBeNull();
    // After Failure, value should not be changed
    expect(testingMPT.Search('12345')).toEqual([
        24 - 5 * (1 + TAX_RATIO), 5 * TAX_RATIO, 0
    ]);
    expect(testingMPT.Search('12378')).toEqual([
        13 - 2 * (1 + TAX_RATIO), 2 * TAX_RATIO, 0
    ]);
    expect(testingMPT.Search('14567')).toEqual([
        20 - 1 * (1 + TAX_RATIO), 1 * TAX_RATIO, 0
    ]);

    // Try decrease inexisted address (should fail)
    expect(testingMPT.ModifyValue('13456', '-', 5)).toBeNull();
    expect(testingMPT.ModifyValue('12357', '-', 7)).toBeNull();
    expect(testingMPT.ModifyValue('12257', '-', 7)).toBeNull();
    // After Failure, value should not be changed
    expect(testingMPT.Search('12345')).toEqual([
        24 - 5 * (1 + TAX_RATIO), 5 * TAX_RATIO, 0
    ]);
    expect(testingMPT.Search('12378')).toEqual([
        13 - 2 * (1 + TAX_RATIO), 2 * TAX_RATIO, 0
    ]);
    expect(testingMPT.Search('14567')).toEqual([
        20 - 1 * (1 + TAX_RATIO), 1 * TAX_RATIO, 0
    ]);

});

test('MPT.Verify()', () => {
    // test case for Verify()
    // extension (1) -> branch
    //                   [2] -> extension [3] -> branch
    //                                             [4] -> leaf [5] (7)
    //                                             [7] -> leaf [8] (11)
    //                   [4] -> leaf [567] (15)
    // Try verify (should success)
    //      12345
    //      12378
    //      14567
    //
    // Try verify (should fail)
    //      12346 (wrong leaf key)
    //      12356 (branch doesn't exist)
    //      14568 (leaf partially matches)
    //      12145 (extension partially matches)

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

    // Try verify (should success)
    expect(testingMPT.Verify('12345')).toBeGreaterThanOrEqual(0);
    expect(testingMPT.Verify('12378')).toBeGreaterThanOrEqual(0);
    expect(testingMPT.Verify('14567')).toBeGreaterThanOrEqual(0);
    
    // Try verify (should fail)
    expect(testingMPT.Verify('12346')).not.toBeGreaterThanOrEqual(0);
    expect(testingMPT.Verify('12356')).not.toBeGreaterThanOrEqual(0);
    expect(testingMPT.Verify('14568')).not.toBeGreaterThanOrEqual(0);
    expect(testingMPT.Verify('12145')).not.toBeGreaterThanOrEqual(0);


});

test('MPT.RefundTax()', () => {
    // test case for UpdateTax()
    // extension (1) -> branch
    //                   [2] -> extension [3] -> branch
    //                                             [4] -> leaf [5] (7, 2, 0)
    //                                             [7] -> leaf [8] (11, 1, 0)
    //                   [4] -> leaf [567] (15, 3, 0)
    // Try updating (should success)
    //      12345 + (2)
    //      12378 + (1)
    //      14567 + (1)
    //      14568 + (1) forced (address doesn't exist)
    //      12245 + (1) forced (address doesn't exist)

    //
    // Try refunding (should fail)
    //      14569 + (1) (address doesn't exist)
    //      12247 + (1) (address doesn't exist)
    //      13459 + (1) (address doesn't exist)
    //      12245 + (1) (not enough tax to deduct)

    let testingMPT = new MPT(true, 'account');
    testingMPT.Insert('12345', 7, 2);
    testingMPT.Insert('12378', 11, 1);
    testingMPT.Insert('14567', 15, 3);
    expect(testingMPT.Search('12345')).toEqual([
        7, 2, 0
    ]);
    expect(testingMPT.Search('12378')).toEqual([
        11, 1, 0
    ]);
    expect(testingMPT.Search('14567')).toEqual([
        15, 3, 0
    ]);

    // Update tax (should success)
    expect(testingMPT.RefundTax('12345', 2)).not.toBeNull();
    expect(testingMPT.RefundTax('12378', 1)).not.toBeNull();
    expect(testingMPT.RefundTax('14567', 1)).not.toBeNull();
    expect(testingMPT.RefundTax('14568', 1, true)).not.toBeNull();
    expect(testingMPT.RefundTax('12245', 1, true)).not.toBeNull();

    // Check updated tax
    expect(testingMPT.Search('12345')).toEqual([
        9, 0, 0
    ]);
    expect(testingMPT.Search('12378')).toEqual([
        12, 0, 0
    ]);
    expect(testingMPT.Search('14567')).toEqual([
        16, 2, 0
    ]);
    expect(testingMPT.Search('14568')).toEqual([
        1, 0, 0
    ]);
    expect(testingMPT.Search('12245')).toEqual([
        1, 0, 0
    ]);

    // Update tax (should fail)
    expect(testingMPT.RefundTax('14569', 1)).toBeNull();
    expect(testingMPT.RefundTax('12247', 1)).toBeNull();
    expect(testingMPT.RefundTax('13459', 1)).toBeNull();
    expect(testingMPT.RefundTax('12245', 1)).toBeNull();


    // Search value, tax should not change after failed update
    expect(testingMPT.Search('12345')).toEqual([
        9, 0, 0
    ]);
    expect(testingMPT.Search('12378')).toEqual([
        12, 0, 0
    ]);
    expect(testingMPT.Search('14567')).toEqual([
        16, 2, 0
    ]);
    expect(testingMPT.Search('14568')).toEqual([
        1, 0, 0
    ]);
    expect(testingMPT.Search('12245')).toEqual([
        1, 0, 0
    ]);

});

test('MPT.UpdateTax()', () => {
    // test case for UpdateTax()
    // extension (1) -> branch
    //                   [2] -> extension [3] -> branch
    //                                             [4] -> leaf [5] (7, 2, 0)
    //                                             [7] -> leaf [8] (11, 1, 0)
    //                   [4] -> leaf [567] (15, 3, 0)
    // Try updating (should success)
    //      12345 + (2)
    //      12378 - (1)
    //      14567 + (1)
    //
    // Try refunding (should fail)
    //      12345 - (5) (smaller than 0)
    //      12378 - (1) (smaller than 0)
    //      14568 + (1) (address doesn't exist)
    //      12245 + (1) (address doesn't exist)
    //      13456 + (1) (address doesn't exist)

    let testingMPT = new MPT(true, 'account');
    testingMPT.Insert('12345', 7, 2);
    testingMPT.Insert('12378', 11, 1);
    testingMPT.Insert('14567', 15, 3);
    expect(testingMPT.Search('12345')).toEqual([
        7, 2, 0
    ]);
    expect(testingMPT.Search('12378')).toEqual([
        11, 1, 0
    ]);
    expect(testingMPT.Search('14567')).toEqual([
        15, 3, 0
    ]);

    // Update tax (should success)
    expect(testingMPT.UpdateTax('12345', 2)).toBeGreaterThanOrEqual(0);
    expect(testingMPT.UpdateTax('12378', -1)).toBeGreaterThanOrEqual(0);
    expect(testingMPT.UpdateTax('14567', 1)).toBeGreaterThanOrEqual(0);

    // Update tax (should fail)
    expect(testingMPT.UpdateTax('12345', -5)).not.toBeGreaterThanOrEqual(0);
    expect(testingMPT.UpdateTax('12378', -1)).not.toBeGreaterThanOrEqual(0);
    expect(testingMPT.UpdateTax('14568', 1)).toBeNull();
    expect(testingMPT.UpdateTax('12245', 1)).toBeNull();
    expect(testingMPT.UpdateTax('13465', 1)).toBeNull();

    // Search value, tax should not change after failed update
    expect(testingMPT.Search('12345')).toEqual([
        7, 4, 0
    ])
    expect(testingMPT.Search('12378')).toEqual([
        11, 0, 0
    ])
    expect(testingMPT.Search('14567')).toEqual([
        15, 4, 0
    ])

});

test('MPT.UpdateDbit()', () => {
    // test case for UpdateDbit()
    // extension (1) -> branch
    //                   [2] -> extension [3] -> branch
    //                                             [4] -> leaf [5] (7, 2, 0)
    //                                             [7] -> leaf [8] (11, 1, 0)
    //                   [4] -> leaf [567] (15, 3, 0)
    // Try updating (should success)
    //      12345 ->1
    //      12378 ->1
    //      14567 ->2
    //
    // Try refunding (should fail)
    //      12345 ->3   (not in enum)
    //      12378 ->-1  (not in enum)
    //      14567 ->5   (not in enum)
    //      12356 ->1   (DNE)
    //      12349 ->1   (DNE)
    //      12349 ->3   (DNE, not in enum)
    //      13456 ->1   (DNE)
    //      12234 ->1   (DNE)

    let testingMPT = new MPT(true, 'account');
    testingMPT.Insert('12345', 7, 2);
    testingMPT.Insert('12378', 11, 1);
    testingMPT.Insert('14567', 15, 3);
    expect(testingMPT.Search('12345')).toEqual([
        7, 2, 0
    ]);
    expect(testingMPT.Search('12378')).toEqual([
        11, 1, 0
    ]);
    expect(testingMPT.Search('14567')).toEqual([
        15, 3, 0
    ]);

    // Update Dbit (should success)
    expect(testingMPT.UpdateDbit('12345', 1)).not.toBeNull();
    expect(testingMPT.UpdateDbit('12378', 1)).not.toBeNull();
    expect(testingMPT.UpdateDbit('14567', 2)).not.toBeNull();

    // Verify successful update
    expect(testingMPT.Search('12345')).toEqual([
        7, 2, 1
    ])
    expect(testingMPT.Search('12378')).toEqual([
        11, 1, 1
    ])
    expect(testingMPT.Search('14567')).toEqual([
        15, 3, 2
    ])

    // Update Dbit (should fail)
    expect(testingMPT.UpdateDbit('12345', 3)).toBeNull();
    expect(testingMPT.UpdateDbit('12378', -1)).toBeNull();
    expect(testingMPT.UpdateDbit('14567', 5)).toBeNull();
    expect(testingMPT.UpdateDbit('12356', 1)).toBeNull();
    expect(testingMPT.UpdateDbit('12349', 1)).toBeNull();
    expect(testingMPT.UpdateDbit('12349', 3)).toBeNull();
    expect(testingMPT.UpdateDbit('13456', 1)).toBeNull();
    expect(testingMPT.UpdateDbit('12234', 1)).toBeNull();

    // Search value, Dbit should not change after failed update
    expect(testingMPT.Search('12345')).toEqual([
        7, 2, 1
    ])
    expect(testingMPT.Search('12378')).toEqual([
        11, 1, 1
    ])
    expect(testingMPT.Search('14567')).toEqual([
        15, 3, 2
    ])
});

test('MPT.Cal_old_hash()', () => {
    // test case for Cal_old_hash()
    // extension (1) -> branch
    //                   [2] -> extension [3] -> branch
    //                                             [4] -> leaf [5] (7, 2, 0)
    //                                             [7] -> leaf [8] (11, 1, 0)
    //                   [4] -> leaf [567] (15, 3, 0)

    let testingMPT = new MPT(true, 'account');
    testingMPT.Insert('12345', 7, 2);
    testingMPT.Insert('12378', 11, 1);
    testingMPT.Insert('14567', 15, 3);
    testingMPT.Cal_old_hash();
    expect(testingMPT.saved).toBeTruthy();
    
});

test('MPT.TotalTax()', () => {
    // test case for TotalTax()
    // extension (1) -> branch
    //                   [2] -> extension [3] -> branch
    //                                             [4] -> leaf [5] (7, 2, 0)
    //                                             [7] -> leaf [8] (11, 1, 0)
    //                   [4] -> leaf [567] (15, 3, 0)
    // should return 6

    let testingMPT = new MPT(true, 'account');
    testingMPT.Insert('12345', 7, 2);
    testingMPT.Insert('12378', 11, 1);
    testingMPT.Insert('14567', 15, 3);
    expect(testingMPT.Search('12345')).toEqual([
        7, 2, 0
    ]);
    expect(testingMPT.Search('12378')).toEqual([
        11, 1, 0
    ]);
    expect(testingMPT.Search('14567')).toEqual([
        15, 3, 0
    ]);

    expect(testingMPT.TotalTax()).toEqual(6)
});

test('MPT.Select()', () => {
    // test case for Select()
    // extension (1) -> branch
    //                   [2] -> extension [3] -> branch (5, 4, 0)
    //                                             [4] -> leaf [5] (7, 2, 0)
    //                                             [7] -> leaf [8] (11, 1, 0)
    //                   [4] -> leaf [567] (15, 3, 0)
    // select with h=5 should return '14567'
    // select with h=4 should return '14567'
    // select with h=3 should return '14567'
    // select with h=2 should return '12378'
    // select with h=1 should return '12378'
    // select with h=0 should return '12378'

    let testingMPT = new MPT(true, 'account');
    testingMPT.Insert('12345', 7, 2);
    testingMPT.Insert('12378', 11, 1);
    testingMPT.Insert('14567', 15, 3);
    console.log('start now')
    testingMPT.Insert('123', 5, 4);
    expect(testingMPT.Search('12345')).toEqual([
        7, 2, 0
    ]);
    expect(testingMPT.Search('12378')).toEqual([
        11, 1, 0
    ]);
    expect(testingMPT.Search('14567')).toEqual([
        15, 3, 0
    ]);
    expect(testingMPT.Search('123')).toEqual([
        5, 4, 0
    ]);

    expect(testingMPT.Select(9, 0, 0)).toEqual([
        1, '14567'
    ]);
    expect(testingMPT.Select(8, 0, 0)).toEqual([
        1, '14567'
    ]);
    expect(testingMPT.Select(7, 0, 0)).toEqual([
        1, '14567'
    ]);
    expect(testingMPT.Select(6, 0, 0)).toEqual([
        1, '12378'
    ]);
    expect(testingMPT.Select(5, 0, 0)).toEqual([
        1, '12345'
    ]);
    expect(testingMPT.Select(4, 0, 0)).toEqual([
        1, '12345'
    ]);
    expect(testingMPT.Select(3, 0, 0)).toEqual([
        1, '123'
    ]);
    expect(testingMPT.Select(2, 0, 0)).toEqual([
        1, '123'
    ]);
    expect(testingMPT.Select(1, 0, 0)).toEqual([
        1, '123'
    ]);
    expect(testingMPT.Select(0, 0, 0)).toEqual([
        1, '123'
    ]);
});