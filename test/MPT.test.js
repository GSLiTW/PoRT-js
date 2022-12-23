const MPT = require('../src/MPT/MPT'); // include MPT as DUT
const BRANCH = 'branch';
const EXTENSION = 'extension';
const LEAF = 'leaf';
const TAX_RATIO = 0.0001;
const PRECISION = 6;
const BASE = 1000000000000;

test('constructor with default parameters', () => {
  const testingMPT = new MPT();
  expect(testingMPT.root).toEqual(false);
  expect(testingMPT.type).toEqual('account');
});

test('constructor with custom parameters', () => {
  const testingMPT = new MPT(true, 'receipt');
  expect(testingMPT.root).toEqual(true);
  expect(testingMPT.type).toEqual('receipt');
});

test('MPT.KeyExist()', () => {
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
  const testingMPT = new MPT(true, 'account');
  testingMPT.Insert('12345', 7 * BASE);
  testingMPT.Insert('12378', 11* BASE);
  testingMPT.Insert('14567', 15* BASE);
  testingMPT.Insert('123', 1);
  expect(testingMPT.KeyExist('12345')).toBe(true);
  expect(testingMPT.KeyExist('12378')).toBe(true);
  expect(testingMPT.KeyExist('14567')).toBe(true);
  expect(testingMPT.KeyExist('123')).toBe(true);

  expect(testingMPT.KeyExist('14568')).toBe(false);
  expect(testingMPT.KeyExist('12267')).toBe(false);
  expect(testingMPT.KeyExist('13567')).toBe(false);

  const testingMPTaccount = new MPT(true, 'receipt');
  testingMPTaccount.Insert('12345', 7* BASE);
  expect(testingMPTaccount.KeyExist('12345')).toBeNull();
});

test('MPT.Insert() root -> leaf with default parameters', () => {
  const testingMPT = new MPT(true, 'account');
  testingMPT.Insert('h12345', 0);
  expect(testingMPT.root).toEqual(true);
  expect(testingMPT.type).toEqual('account');
  expect(testingMPT.key).toEqual('h12345');
  expect(testingMPT.value.Value()).toEqual([
    0, 0, [0, 0],
  ]);
});

test('MPT.Insert() root -> leaf with custom parameters', () => {
  const testingMPT = new MPT(true, 'account');
  testingMPT.Insert('h12345', 0, 3, 1);
  expect(testingMPT.root).toEqual(true);
  expect(testingMPT.type).toEqual('account');
  expect(testingMPT.key).toEqual('h12345');
  expect(testingMPT.value.Value()).toEqual([
    0, 3, 1,
  ]);
});

test('MPT.Insert() insert existed key', () => {
  // (before insert:) leaf
  // (after insert:) extension -> branch[5]
  //                              branch[8]
  const testingMPT = new MPT(true, 'account');
  testingMPT.Insert('12345', 0);
  expect(testingMPT.Insert('12345', 0)).toBeNull(); // insert existed key
});

test('MPT.Insert() leaf -> extension with default parameters', () => {
  // (before insert:) leaf
  // (after insert:) extension -> branch[5]
  //                              branch[8]
  const testingMPT = new MPT(true, 'account');
  testingMPT.Insert('12345', 0);
  testingMPT.Insert('12348', 0);
  expect(testingMPT.mode).toEqual(EXTENSION);
  expect(testingMPT.key).toEqual('1234');
  expect(testingMPT.value).toEqual(null);
  expect(testingMPT.next).not.toBeNull(); // shall exists

  nextNode = testingMPT.next;
  expect(nextNode.mode).toEqual(BRANCH);
  expect(nextNode.branch[5]).not.toBeNull(); // for h12345
  expect(nextNode.branch[8]).not.toBeNull(); // for h12348

  Node_h12345 = nextNode.branch[5];
  Node_h12348 = nextNode.branch[8];

  expect(Node_h12345.mode).toEqual(LEAF);
  expect(Node_h12345.key).toEqual('');
  expect(Node_h12345.value.Value()).toEqual([
    0, 0, [0, 0],
  ]);
  expect(Node_h12348.mode).toEqual(LEAF);
  expect(Node_h12348.key).toEqual('');
  expect(Node_h12348.value.Value()).toEqual([
    0, 0, [0, 0],
  ]);
});

test('MPT.Insert() leaf -> branch with default parameters', () => {
  // (before insert:) leaf
  // (after insert:) branch[1] -> leaf
  //                 branch[2] -> leaf
  const testingMPT = new MPT(true, 'account');
  testingMPT.Insert('12345', 7* BASE);
  testingMPT.Insert('22345', 11* BASE);
  expect(testingMPT.mode).toEqual(BRANCH);
  expect(testingMPT.branch[1]).not.toBeNull(); // shall exists
  expect(testingMPT.branch[2]).not.toBeNull(); // shall exists

  Node_12345 = testingMPT.branch[1];
  Node_22345 = testingMPT.branch[2];
  expect(Node_12345.mode).toEqual(LEAF);
  expect(Node_12345.key).toEqual('2345');
  expect(Node_12345.value.Value()).toEqual([
    7* BASE, 0, [0, 0],
  ]);
  expect(Node_22345.mode).toEqual(LEAF);
  expect(Node_22345.key).toEqual('2345');
  expect(Node_22345.value.Value()).toEqual([
    11* BASE, 0, [0, 0],
  ]);
});

test('MPT.Insert() branch -> ... with default parameters', () => {
  // (before insert:) branch
  // (after insert:) branch[1] -> leaf
  //                 branch[2] -> leaf
  //                 branch[3] -> leaf
  const testingMPT = new MPT(true, 'account');
  testingMPT.Insert('12345', 7* BASE);
  testingMPT.Insert('22345', 11* BASE);
  testingMPT.Insert('33456', 13* BASE);
  expect(testingMPT.mode).toEqual(BRANCH);
  expect(testingMPT.branch[1]).not.toBeNull(); // shall exists
  expect(testingMPT.branch[2]).not.toBeNull(); // shall exists
  expect(testingMPT.branch[3]).not.toBeNull(); // shall exists

  Node_33456 = testingMPT.branch[3];

  expect(Node_33456.mode).toEqual(LEAF);
  expect(Node_33456.key).toEqual('3456');
  expect(Node_33456.value.Value()).toEqual([
    13* BASE, 0, [0, 0],
  ]);
});

test('MPT.Insert() branch -> ... with default parameters', () => {
  // (after insert:) branch[1] -> leaf (2345)
  //                 branch[2] -> branch[2] -> leaf (345)
  //                              branch[2] self
  //                              branch[3] -> leaf (456)
  const testingMPT = new MPT(true, 'account');
  // setting up MPT
  testingMPT.Insert('12345', 7* BASE);
  testingMPT.Insert('22345', 11* BASE);
  testingMPT.Insert('23456', 13* BASE);

  // now insert new node for testing
  testingMPT.Insert('2', 15* BASE);
  expect(testingMPT.mode).toEqual(BRANCH);
  expect(testingMPT.branch[1]).not.toBeNull(); // shall exists
  expect(testingMPT.branch[2]).not.toBeNull(); // shall exists

  Node_2 = testingMPT.branch[2]; // Node_2 should be branch

  expect(Node_2.mode).toEqual(BRANCH);
  expect(Node_2.value.Value()).toEqual([
    15* BASE, 0, [0, 0],
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

  const testingMPT = new MPT(true, 'account');
  // setting up MPT
  testingMPT.Insert('12345', 7* BASE);
  testingMPT.Insert('12378', 11* BASE);

  // now insert new node for testing
  testingMPT.Insert('23456', 15* BASE);
  expect(testingMPT.mode).toEqual(BRANCH);
  expect(testingMPT.branch[1]).not.toBeNull(); // shall exists
  expect(testingMPT.branch[2]).not.toBeNull(); // shall exists

  Node_EX_23 = testingMPT.branch[1]; // extension
  Node_LE_3456 = testingMPT.branch[2]; // leaf

  // test Node_EX_23
  expect(Node_EX_23.mode).toEqual(EXTENSION);
  expect(Node_EX_23.key).toEqual('23');
  expect(Node_EX_23.next).not.toBeNull();

  // test Node_LE_3456
  expect(Node_LE_3456.mode).toEqual(LEAF);
  expect(Node_LE_3456.key).toEqual('3456');
  expect(Node_LE_3456.value.Value()).toEqual([
    15* BASE, 0, [0, 0],
  ]);

  Node_BR_123 = Node_EX_23.next; // branch node
  expect(Node_BR_123.mode).toEqual(BRANCH);
  expect(Node_BR_123.branch[4]).not.toBeNull(); // shall exists
  expect(Node_BR_123.branch[7]).not.toBeNull(); // shall exists

  Node_LE_5 = Node_BR_123.branch[4];
  Node_LE_8 = Node_BR_123.branch[7];

  expect(Node_LE_5.mode).toEqual(LEAF);
  expect(Node_LE_5.key).toEqual('5');
  expect(Node_LE_5.value.Value()).toEqual([
    7* BASE, 0, [0, 0],
  ]);
  expect(Node_LE_8.mode).toEqual(LEAF);
  expect(Node_LE_8.key).toEqual('8');
  expect(Node_LE_8.value.Value()).toEqual([
    11* BASE, 0, [0, 0],
  ]);
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

  const testingMPT = new MPT(true, 'account');


  // setting up MPT and test before insertion
  testingMPT.Insert('12345', 7* BASE);
  testingMPT.Insert('12378', 11* BASE);
  expect(testingMPT.mode).toEqual(EXTENSION);
  expect(testingMPT.next).not.toBeNull();
  expect(testingMPT.key).toEqual('123');
  Node_BR_123 = testingMPT.next;
  expect(Node_BR_123.mode).toEqual(BRANCH);
  expect(Node_BR_123.branch[4]).not.toBeNull();
  expect(Node_BR_123.branch[7]).not.toBeNull();
  Node_LE_5 = Node_BR_123.branch[4];
  Node_LE_8 = Node_BR_123.branch[7];
  expect(Node_LE_5.mode).toEqual(LEAF);
  expect(Node_LE_5.key).toEqual('5');
  expect(Node_LE_5.value.Value()).toEqual([
    7* BASE, 0, [0, 0],
  ]);
  expect(Node_LE_8.mode).toEqual(LEAF);
  expect(Node_LE_8.key).toEqual('8');
  expect(Node_LE_8.value.Value()).toEqual([
    11* BASE, 0, [0, 0],
  ]);


  // now insert new node for testing
  testingMPT.Insert('12356', 15* BASE);
  expect(testingMPT.mode).toEqual(EXTENSION);
  expect(testingMPT.next).not.toBeNull();
  expect(testingMPT.key).toEqual('123');

  Node_BR_123 = testingMPT.next;
  expect(Node_BR_123.mode).toEqual(BRANCH);
  expect(Node_BR_123.branch[4]).not.toBeNull();
  expect(Node_BR_123.branch[5]).not.toBeNull();
  expect(Node_BR_123.branch[7]).not.toBeNull();

  Node_LE_5 = Node_BR_123.branch[4];
  Node_LE_6 = Node_BR_123.branch[5];
  Node_LE_8 = Node_BR_123.branch[7];
  expect(Node_LE_5.mode).toEqual(LEAF);
  expect(Node_LE_5.key).toEqual('5');
  expect(Node_LE_5.value.Value()).toEqual([
    7* BASE, 0, [0, 0],
  ]);
  expect(Node_LE_6.mode).toEqual(LEAF);
  expect(Node_LE_6.key).toEqual('6');
  expect(Node_LE_6.value.Value()).toEqual([
    15* BASE, 0, [0, 0],
  ]);
  expect(Node_LE_8.mode).toEqual(LEAF);
  expect(Node_LE_8.key).toEqual('8');
  expect(Node_LE_8.value.Value()).toEqual([
    11* BASE, 0, [0, 0],
  ]);
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

  const testingMPT = new MPT(true, 'account');


  // setting up MPT and test before insertion
  testingMPT.Insert('12345', 7 * BASE);
  testingMPT.Insert('12378', 11 * BASE);
  expect(testingMPT.mode).toEqual(EXTENSION);
  expect(testingMPT.next).not.toBeNull();
  expect(testingMPT.key).toEqual('123');
  Node_BR_123 = testingMPT.next;
  expect(Node_BR_123.mode).toEqual(BRANCH);
  expect(Node_BR_123.branch[4]).not.toBeNull();
  expect(Node_BR_123.branch[7]).not.toBeNull();
  Node_LE_5 = Node_BR_123.branch[4];
  Node_LE_8 = Node_BR_123.branch[7];
  expect(Node_LE_5.mode).toEqual(LEAF);
  expect(Node_LE_5.key).toEqual('5');
  expect(Node_LE_5.value.Value()).toEqual([
    7 * BASE, 0, [0, 0],
  ]);
  expect(Node_LE_8.mode).toEqual(LEAF);
  expect(Node_LE_8.key).toEqual('8');
  expect(Node_LE_8.value.Value()).toEqual([
    11 * BASE, 0, [0, 0],
  ]);


  // now insert new node for testing
  testingMPT.Insert('12789', 15 * BASE);
  expect(testingMPT.mode).toEqual(EXTENSION);
  expect(testingMPT.next).not.toBeNull();
  expect(testingMPT.key).toEqual('12');

  Node_BR_12 = testingMPT.next;
  expect(Node_BR_12.mode).toEqual(BRANCH);
  expect(Node_BR_12.branch[3]).not.toBeNull();
  expect(Node_BR_12.branch[7]).not.toBeNull();

  Node_BR_123 = Node_BR_12.branch[3];
  Node_LE_89 = Node_BR_12.branch[7];

  expect(Node_BR_123.mode).toEqual(BRANCH);
  expect(Node_BR_123.branch[4]).not.toBeNull();
  expect(Node_BR_123.branch[7]).not.toBeNull();

  expect(Node_LE_89.mode).toEqual(LEAF);
  expect(Node_LE_89.key).toEqual('89');
  expect(Node_LE_89.value.Value()).toEqual([
    15 * BASE, 0, [0, 0],
  ]);

  Node_LE_5 = Node_BR_123.branch[4];
  Node_LE_8 = Node_BR_123.branch[7];

  expect(Node_LE_5.mode).toEqual(LEAF);
  expect(Node_LE_5.key).toEqual('5');
  expect(Node_LE_5.value.Value()).toEqual([
    7 * BASE, 0, [0, 0],
  ]);
  expect(Node_LE_8.mode).toEqual(LEAF);
  expect(Node_LE_8.key).toEqual('8');
  expect(Node_LE_8.value.Value()).toEqual([
    11 * BASE, 0, [0, 0],
  ]);
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

  const testingMPT = new MPT(true, 'account');


  // setting up MPT and test before insertion
  testingMPT.Insert('12345', 7 * BASE);
  testingMPT.Insert('12378', 11 * BASE);
  expect(testingMPT.mode).toEqual(EXTENSION);
  expect(testingMPT.next).not.toBeNull();
  expect(testingMPT.key).toEqual('123');
  Node_BR_123 = testingMPT.next;
  expect(Node_BR_123.mode).toEqual(BRANCH);
  expect(Node_BR_123.branch[4]).not.toBeNull();
  expect(Node_BR_123.branch[7]).not.toBeNull();
  Node_LE_5 = Node_BR_123.branch[4];
  Node_LE_8 = Node_BR_123.branch[7];
  expect(Node_LE_5.mode).toEqual(LEAF);
  expect(Node_LE_5.key).toEqual('5');
  expect(Node_LE_5.value.Value()).toEqual([
    7 * BASE, 0, [0, 0],
  ]);
  expect(Node_LE_8.mode).toEqual(LEAF);
  expect(Node_LE_8.key).toEqual('8');
  expect(Node_LE_8.value.Value()).toEqual([
    11 * BASE, 0, [0, 0],
  ]);


  // now insert new node for testing
  testingMPT.Insert('14567', 15 * BASE);
  expect(testingMPT.mode).toEqual(EXTENSION);
  expect(testingMPT.next).not.toBeNull();
  expect(testingMPT.key).toEqual('1');

  Node_BR_1 = testingMPT.next;
  expect(Node_BR_1.mode).toEqual(BRANCH);
  expect(Node_BR_1.branch[2]).not.toBeNull();
  expect(Node_BR_1.branch[4]).not.toBeNull();

  Node_EX_3 = Node_BR_1.branch[2];
  Node_LE_567 = Node_BR_1.branch[4];

  // Node_EX_3
  expect(Node_EX_3.mode).toEqual(EXTENSION);
  expect(Node_EX_3.key).toEqual('3');
  expect(Node_EX_3.next).not.toBeNull();
  // Node_LE_567
  expect(Node_LE_567.mode).toEqual(LEAF);
  expect(Node_LE_567.key).toEqual('567');
  expect(Node_LE_567.value.Value()).toEqual([
    15 * BASE, 0, [0, 0],
  ]);

  Node_BR_123 = Node_EX_3.next;
  expect(Node_BR_123.mode).toEqual(BRANCH);
  expect(Node_BR_123.branch[4]).not.toBeNull();
  expect(Node_BR_123.branch[7]).not.toBeNull();

  Node_LE_5 = Node_BR_123.branch[4];
  Node_LE_8 = Node_BR_123.branch[7];

  expect(Node_LE_5.mode).toEqual(LEAF);
  expect(Node_LE_5.key).toEqual('5');
  expect(Node_LE_5.value.Value()).toEqual([
    7 * BASE, 0, [0, 0],
  ]);
  expect(Node_LE_8.mode).toEqual(LEAF);
  expect(Node_LE_8.key).toEqual('8');
  expect(Node_LE_8.value.Value()).toEqual([
    11 * BASE, 0, [0, 0],
  ]);
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

  const testingMPT = new MPT(true, 'account');


  // setting up MPT and test before insertion
  testingMPT.Insert('12345', 7 * BASE);
  testingMPT.Insert('13456', 11 * BASE);
  expect(testingMPT.mode).toEqual(EXTENSION);
  expect(testingMPT.next).not.toBeNull();
  expect(testingMPT.key).toEqual('1');
  Node_BR_1 = testingMPT.next;
  expect(Node_BR_1.mode).toEqual(BRANCH);
  expect(Node_BR_1.branch[2]).not.toBeNull();
  expect(Node_BR_1.branch[3]).not.toBeNull();
  Node_LE_345 = Node_BR_1.branch[2];
  Node_LE_456 = Node_BR_1.branch[3];
  expect(Node_LE_345.mode).toEqual(LEAF);
  expect(Node_LE_345.key).toEqual('345');
  expect(Node_LE_345.value.Value()).toEqual([
    7 * BASE, 0, [0, 0],
  ]);
  expect(Node_LE_456.mode).toEqual(LEAF);
  expect(Node_LE_456.key).toEqual('456');
  expect(Node_LE_456.value.Value()).toEqual([
    11 * BASE, 0, [0, 0],
  ]);


  // now insert new node for testing
  testingMPT.Insert('23456', 15 * BASE);
  expect(testingMPT.mode).toEqual(BRANCH);
  expect(testingMPT.branch[1]).not.toBeNull();
  expect(testingMPT.branch[2]).not.toBeNull();

  Node_BR_1 = testingMPT.branch[1];
  Node_LE_3456 = testingMPT.branch[2];
  // Node_BR_1
  expect(Node_BR_1.mode).toEqual(BRANCH);
  expect(Node_BR_1.branch[2]).not.toBeNull();
  expect(Node_BR_1.branch[3]).not.toBeNull();
  // Node_LE_3456
  expect(Node_LE_3456.mode).toEqual(LEAF);
  expect(Node_LE_3456.key).toEqual('3456');
  expect(Node_LE_3456.value.Value()).toEqual([
    15 * BASE, 0, [0, 0],
  ]);

  Node_LE_345 = Node_BR_1.branch[2];
  Node_LE_456 = Node_BR_1.branch[3];

  // Node_LE345
  expect(Node_LE_345.mode).toEqual(LEAF);
  expect(Node_LE_345.key).toEqual('345');
  expect(Node_LE_345.value.Value()).toEqual([
    7 * BASE, 0, [0, 0],
  ]);
  // Node_LE_456
  expect(Node_LE_456.mode).toEqual(LEAF);
  expect(Node_LE_456.key).toEqual('456');
  expect(Node_LE_456.value.Value()).toEqual([
    11 * BASE, 0, [0, 0],
  ]);
});

test('MPT.Insert() insert with type = tx', () => {
  // (before insert:) leaf
  // (after insert:) extension -> branch[5]
  //                              branch[8]
  const testingMPT = new MPT(true, 'tx');
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
  const testingMPT = new MPT(true, 'account');
  testingMPT.Insert('12345', 7 * BASE);
  testingMPT.Insert('12378', 11 * BASE);
  testingMPT.Insert('14567', 15 * BASE);
  expect(testingMPT.Search('12345').Value()).toEqual([
    7 * BASE, 0, [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    11 * BASE, 0, [0, 0],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    15 * BASE, 0, [0, 0],
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
  const testingMPT = new MPT(true, 'receipt');
  testingMPT.Insert('12345', 7 * BASE);
  testingMPT.Insert('12378', 11 * BASE);
  testingMPT.Insert('14567', 15 * BASE);
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

  const testingMPT = new MPT(true, 'account');
  testingMPT.Insert('12345', 7 * BASE);
  testingMPT.Insert('12378', 11 * BASE);
  testingMPT.Insert('14567', 15 * BASE);
  expect(testingMPT.Search('12345').Value()).toEqual([
    7 * BASE, 0, [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    11 * BASE, 0, [0, 0],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    15 * BASE, 0, [0, 0],
  ]);

  // Try increase (should success)
  expect(testingMPT.ModifyValue('12345', '+', 17 * BASE)).not.toBeNull();
  expect(testingMPT.ModifyValue('12378', '+', 2 * BASE)).not.toBeNull();
  expect(testingMPT.ModifyValue('14567', '+', 5 * BASE)).not.toBeNull();
  expect(testingMPT.Search('12345').Value()).toEqual([
    24 * BASE, 0, [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    13 * BASE, 0, [0, 0],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    20 * BASE, 0, [0, 0],
  ]);
  // Try decrease (should success)
  expect(testingMPT.ModifyValue('12345', '-', 5 * BASE)).not.toBeNull();
  expect(testingMPT.ModifyValue('12378', '-', 2 * BASE)).not.toBeNull();
  expect(testingMPT.ModifyValue('14567', '-', 1 * BASE)).not.toBeNull();
  expect(testingMPT.Search('12345').Value()).toEqual([
    (24 - 5 - 5 * TAX_RATIO) * BASE, 5 * TAX_RATIO * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    (13 - 2 - 2 * TAX_RATIO) * BASE, 2 * TAX_RATIO * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    (20 - 1 - 1 * TAX_RATIO) * BASE, 1 * TAX_RATIO * BASE, [0, 0],
  ]);

  // Try decrease (should fail)
  expect(testingMPT.ModifyValue('12345', '-', 31 * BASE)).toBeNull();
  expect(testingMPT.ModifyValue('12378', '-', 25 * BASE)).toBeNull();
  // After Failure, value should not be changed
  expect(testingMPT.Search('12345').Value()).toEqual([
    (24 - 5 - 5 * TAX_RATIO) * BASE, 5 * TAX_RATIO * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    (13 - 2 - 2 * TAX_RATIO) * BASE, 2 * TAX_RATIO * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    (20 - 1 - 1 * TAX_RATIO) * BASE, 1 * TAX_RATIO * BASE, [0, 0],
  ]);

  // Try invalid modify flag (should fail)
  expect(testingMPT.ModifyValue('12345', '*', 17)).toBeNull();
  expect(testingMPT.ModifyValue('12345', 'k', 15)).toBeNull();
  expect(testingMPT.ModifyValue('12345', '!', 3)).toBeNull();
  // After Failure, value should not be changed
  expect(testingMPT.Search('12345').Value()).toEqual([
    (24 - 5 - 5 * TAX_RATIO) * BASE, 5 * TAX_RATIO * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    (13 - 2 - 2 * TAX_RATIO) * BASE, 2 * TAX_RATIO * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    (20 - 1 - 1 * TAX_RATIO) * BASE, 1 * TAX_RATIO * BASE, [0, 0],
  ]);

  // Try decrease inexisted address (should fail)
  expect(testingMPT.ModifyValue('13456', '-', 5)).toBeNull();
  expect(testingMPT.ModifyValue('12357', '-', 7)).toBeNull();
  expect(testingMPT.ModifyValue('12257', '-', 7)).toBeNull();
  // After Failure, value should not be changed
  expect(testingMPT.Search('12345').Value()).toEqual([
    (24 - 5 - 5 * TAX_RATIO) * BASE, 5 * TAX_RATIO * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    (13 - 2 - 2 * TAX_RATIO) * BASE, 2 * TAX_RATIO * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    (20 - 1 - 1 * TAX_RATIO) * BASE, 1 * TAX_RATIO * BASE, [0, 0],
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

  const testingMPT = new MPT(true, 'account');
  testingMPT.Insert('12345', 7 * BASE);
  testingMPT.Insert('12378', 11 * BASE);
  testingMPT.Insert('14567', 15 * BASE);
  expect(testingMPT.Search('12345').Value()).toEqual([
    7 * BASE, 0, [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    11 * BASE, 0, [0, 0],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    15 * BASE, 0, [0, 0],
  ]);

  // Try verify (should success)
  expect(testingMPT.Verify('12345')).not.toEqual([-1, -1]);
  expect(testingMPT.Verify('12378')).not.toEqual([-1, -1]);
  expect(testingMPT.Verify('14567')).not.toEqual([-1, -1]);

  // Try verify (should fail)
  expect(testingMPT.Verify('12346')).toEqual([-1, -1]);
  expect(testingMPT.Verify('12356')).toEqual([-1, -1]);
  expect(testingMPT.Verify('14568')).toEqual([-1, -1]);
  expect(testingMPT.Verify('12145')).toEqual([-1, -1]);
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

  const testingMPT = new MPT(true, 'account');
  testingMPT.Insert('12345', 7 * BASE, 2 * BASE);
  testingMPT.Insert('12378', 11 * BASE, 1 * BASE);
  testingMPT.Insert('14567', 15 * BASE, 3 * BASE);
  expect(testingMPT.Search('12345').Value()).toEqual([
    7 * BASE, 2 * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    11 * BASE, 1 * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    15 * BASE, 3 * BASE, [0, 0],
  ]);

  // Update tax (should success)
  expect(testingMPT.RefundTax('12345', 2 * BASE)).not.toBeNull();
  expect(testingMPT.RefundTax('12378', 1 * BASE)).not.toBeNull();
  expect(testingMPT.RefundTax('14567', 1 * BASE)).not.toBeNull();
  expect(testingMPT.RefundTax('14568', 1 * BASE, true)).not.toBeNull();
  expect(testingMPT.RefundTax('12245', 1 * BASE, true)).not.toBeNull();

  // Check updated tax
  expect(testingMPT.Search('12345').Value()).toEqual([
    9 * BASE, 0, [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    12 * BASE, 0, [0, 0],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    16 * BASE, 2 * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('14568').Value()).toEqual([
    1 * BASE, 0, [0, 0],
  ]);
  expect(testingMPT.Search('12245').Value()).toEqual([
    1 * BASE, 0, [0, 0],
  ]);

  // Update tax (should fail)
  expect(testingMPT.RefundTax('14569', 1 * BASE)).toBeNull();
  expect(testingMPT.RefundTax('12247', 1 * BASE)).toBeNull();
  expect(testingMPT.RefundTax('13459', 1 * BASE)).toBeNull();
  expect(testingMPT.RefundTax('12245', 1 * BASE)).toBeNull();


  // Search value, tax should not change after failed update
  expect(testingMPT.Search('12345').Value()).toEqual([
    9 * BASE, 0, [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    12 * BASE, 0, [0, 0],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    16 * BASE, 2 * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('14568').Value()).toEqual([
    1 * BASE, 0, [0, 0],
  ]);
  expect(testingMPT.Search('12245').Value()).toEqual([
    1 * BASE, 0, [0, 0],
  ]);
});

test('MPT.UpdateValue()', () => {
  // test case for UpdateValue()
  // extension (1) -> branch
  //                   [2] -> extension [3] -> branch
  //                                             [4] -> leaf [5] (7, 2, 0)
  //                                             [7] -> leaf [8] (11, 1, 0)
  //                   [4] -> leaf [567] (15, 3, 0)
  // Try updating (should success)
  //      12345 -> 12378 (5)
  //      12378 -> 14567 (2)
  //      14567 -> 12345 (3)
  //      14567 -> 13456 (1)  (destination address doesn't exist)
  //
  // Results:
  //      12345 (5, 2, 0)
  //      12378 (14, 1, 0)
  //      14567 (13, 3, 0)
  //      13456 (1, 0, 0)
  //
  // Try refunding (should fail)
  //      14568 -> 12378 (2)  (source address doesn't exist)
  //      12345 -> 14567 (9)  (source address not enough balance)
  //      12345 -> 14567 (-2) (update value < 0)

  const testingMPT = new MPT(true, 'account');
  testingMPT.Insert('12345', 7 * BASE, 2 * BASE);
  testingMPT.Insert('12378', 11 * BASE, 1 * BASE);
  testingMPT.Insert('14567', 15 * BASE, 3 * BASE);
  expect(testingMPT.Search('12345').Value()).toEqual([
    7 * BASE, 2 * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    11 * BASE, 1 * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    15 * BASE, 3 * BASE, [0, 0],
  ]);

  // Update value (should success)
  expect(testingMPT.UpdateValue('12345', '12378', 5 * BASE)).not.toBeNull();
  expect(testingMPT.UpdateValue('12378', '14567', 2 * BASE)).not.toBeNull();
  expect(testingMPT.UpdateValue('14567', '12345', 3 * BASE)).not.toBeNull();
  expect(testingMPT.UpdateValue('14567', '13456', 1 * BASE)).not.toBeNull();

  // Verify value
  expect(testingMPT.Search('12345').Value()).toEqual([
    (5 - 5 * TAX_RATIO) * BASE, (2 * BASE + 5 * TAX_RATIO * BASE), [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    14 * BASE - 2 * TAX_RATIO * BASE, 1 * BASE + 2 * TAX_RATIO * BASE, [0, 0],
  ]);
  /*
    expect(testingMPT.Search('14567')).toEqual([
        13 - 4 * TAX_RATIO, 3 + 4 * TAX_RATIO, 0
    ]);
    */


  // resTemp = testingMPT.Search('14567').Value();
  expect(testingMPT.Search('14567').Value()).toEqual([
    13 * BASE - 4 * TAX_RATIO * BASE, 3 * BASE + 4 * TAX_RATIO * BASE, [0, 0],
  ]);
  // expect(resTemp[0]).toEqual(13);
  // expect(resTemp[1]).toEqual(3);
  // expect(resTemp[2]).toEqual([0, 0]);

  expect(testingMPT.Search('13456').Value()).toEqual([
    1 * BASE, 0, [0, 0],
  ]);

  // Update tax (should fail)
  expect(testingMPT.UpdateValue('14568', '12378', 2 * BASE)).toBeNull();
  expect(testingMPT.UpdateValue('12345', '14567', 9 * BASE)).toBeNull();
  expect(testingMPT.UpdateValue('12345', '14567', -2 * BASE)).toBeNull();

  // Verify value, should not change after failed update
  expect(testingMPT.Search('12345').Value()).toEqual([
    (5 - 5 * TAX_RATIO) * BASE, (2 * BASE + 5 * TAX_RATIO * BASE), [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    14 * BASE - 2 * TAX_RATIO * BASE, 1 * BASE + 2 * TAX_RATIO * BASE, [0, 0],
  ]);
  /*
    expect(testingMPT.Search('14567')).toEqual([
        13 - 4 * TAX_RATIO, 3 + 4 * TAX_RATIO, 0
    ]);
    */

  expect(testingMPT.Search('14567').Value()).toEqual([
    13 * BASE - 4 * TAX_RATIO * BASE, 3 * BASE + 4 * TAX_RATIO * BASE, [0, 0],
  ]);

  expect(testingMPT.Search('13456').Value()).toEqual([
    1 * BASE, 0, [0, 0],
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

  const testingMPT = new MPT(true, 'account');
  testingMPT.Insert('12345', 7 * BASE, 2 * BASE);
  testingMPT.Insert('12378', 11 * BASE, 1 * BASE);
  testingMPT.Insert('14567', 15 * BASE, 3 * BASE);
  expect(testingMPT.Search('12345').Value()).toEqual([
    7 * BASE, 2 * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    11 * BASE, 1 * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    15 * BASE, 3 * BASE, [0, 0],
  ]);

  // Update tax (should success)
  expect(testingMPT.UpdateTax('12345', 2 * BASE)).toBeGreaterThanOrEqual(0);
  expect(testingMPT.UpdateTax('12378', -1 * BASE)).toBeGreaterThanOrEqual(0);
  expect(testingMPT.UpdateTax('14567', 1 * BASE)).toBeGreaterThanOrEqual(0);

  // Update tax (should fail)
  expect(testingMPT.UpdateTax('12345', -5 * BASE)).not.toBeGreaterThanOrEqual(0);
  expect(testingMPT.UpdateTax('12378', -1 * BASE)).not.toBeGreaterThanOrEqual(0);
  expect(testingMPT.UpdateTax('14568', 1 * BASE)).toBeNull();
  expect(testingMPT.UpdateTax('12245', 1 * BASE)).toBeNull();
  expect(testingMPT.UpdateTax('13465', 1 * BASE)).toBeNull();

  // Search value, tax should not change after failed update
  expect(testingMPT.Search('12345').Value()).toEqual([
    7 * BASE, 4 * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    11 * BASE, 0, [0, 0],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    15 * BASE, 4 * BASE, [0, 0],
  ]);
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

  const testingMPT = new MPT(true, 'account');
  testingMPT.Insert('12345', 7 * BASE, 2 * BASE);
  testingMPT.Insert('12378', 11 * BASE, 1 * BASE);
  testingMPT.Insert('14567', 15 * BASE, 3 * BASE);
  expect(testingMPT.Search('12345').Value()).toEqual([
    7 * BASE, 2 * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    11 * BASE, 1 * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    15 * BASE, 3 * BASE, [0, 0],
  ]);

  // Update Dbit (should success)
  expect(testingMPT.UpdateDbit('12345', [1, 1])).not.toBeNull();
  expect(testingMPT.UpdateDbit('12378', [2, 1])).not.toBeNull();
  expect(testingMPT.UpdateDbit('14567', [2, 2])).not.toBeNull();

  // Verify successful update
  expect(testingMPT.Search('12345').Value()).toEqual([
    7 * BASE, 2 * BASE, [1, 1],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    11 * BASE, 1 * BASE, [2, 1],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    15 * BASE, 3 * BASE, [2, 2],
  ]);

  // Update Dbit (should fail)
  expect(testingMPT.UpdateDbit('12345', [1, 3])).toBeNull();
  expect(testingMPT.UpdateDbit('12378', [2, -1])).toBeNull();
  expect(testingMPT.UpdateDbit('14567', [0, 5])).toBeNull();
  expect(testingMPT.UpdateDbit('12356', [0, 1])).toBeNull();
  expect(testingMPT.UpdateDbit('12349', [-1, 1])).toBeNull();
  expect(testingMPT.UpdateDbit('12349', [3, 3])).toBeNull();
  expect(testingMPT.UpdateDbit('13456', [3, 1])).toBeNull();
  expect(testingMPT.UpdateDbit('12234', [-2, 1])).toBeNull();

  // Search value, Dbit should not change after failed update
  expect(testingMPT.Search('12345').Value()).toEqual([
    7 * BASE, 2 * BASE, [1, 1],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    11 * BASE, 1 * BASE, [2, 1],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    15 * BASE, 3 * BASE, [2, 2],
  ]);
});

test('MPT.Cal_old_hash()', () => {
  // test case for Cal_old_hash()
  // extension (1) -> branch
  //                   [2] -> extension [3] -> branch
  //                                             [4] -> leaf [5] (7, 2, 0)
  //                                             [7] -> leaf [8] (11, 1, 0)
  //                   [4] -> leaf [567] (15, 3, 0)

  const testingMPT = new MPT(true, 'account');
  testingMPT.Insert('12345', 7 * BASE, 2 * BASE);
  testingMPT.Insert('12378', 11 * BASE, 1 * BASE);
  testingMPT.Insert('14567', 15 * BASE, 3 * BASE);
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

  const testingMPT = new MPT(true, 'account');
  testingMPT.Insert('12345', 7 * BASE, 2 * BASE);
  testingMPT.Insert('12378', 11 * BASE, 1 * BASE);
  testingMPT.Insert('14567', 15 * BASE, 3 * BASE);
  expect(testingMPT.Search('12345').Value()).toEqual([
    7 * BASE, 2 * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    11 * BASE, 1 * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    15 * BASE, 3 * BASE, [0, 0],
  ]);

  expect(testingMPT.TotalTax()).toEqual(6 * BASE);
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

  const testingMPT = new MPT(true, 'account');
  testingMPT.Insert('12345', 7 * BASE, 2 * BASE);
  testingMPT.Insert('12378', 11 * BASE, 1 * BASE);
  testingMPT.Insert('14567', 15 * BASE, 3 * BASE);
  testingMPT.Insert('123', 5 * BASE, 4 * BASE);
  expect(testingMPT.Search('12345').Value()).toEqual([
    7 * BASE, 2 * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('12378').Value()).toEqual([
    11 * BASE, 1 * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('14567').Value()).toEqual([
    15 * BASE, 3 * BASE, [0, 0],
  ]);
  expect(testingMPT.Search('123').Value()).toEqual([
    5 * BASE, 4 * BASE, [0, 0],
  ]);

  expect(testingMPT.Select(9 * BASE, 0, 0)).toEqual([
    1, '14567',
  ]);
  expect(testingMPT.Select(8 * BASE, 0, 0)).toEqual([
    1, '14567',
  ]);
  expect(testingMPT.Select(7 * BASE, 0, 0)).toEqual([
    1, '14567',
  ]);
  expect(testingMPT.Select(6 * BASE, 0, 0)).toEqual([
    1, '12378',
  ]);
  expect(testingMPT.Select(5 * BASE, 0, 0)).toEqual([
    1, '12345',
  ]);
  expect(testingMPT.Select(4 * BASE, 0, 0)).toEqual([
    1, '12345',
  ]);
  expect(testingMPT.Select(3 * BASE, 0, 0)).toEqual([
    1, '123',
  ]);
  expect(testingMPT.Select(2 * BASE, 0, 0)).toEqual([
    1, '123',
  ]);
  expect(testingMPT.Select(1 * BASE, 0, 0)).toEqual([
    1, '123',
  ]);
  expect(testingMPT.Select(0, 0, 0)).toEqual([
    1, '123',
  ]);
});
