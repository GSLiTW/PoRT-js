const NodeVal = require('../src/NodeVal');

test('constructor', () => {
  const testingNode = new NodeVal(15, 7, 1);
  expect(testingNode.Balance()).toEqual(15);
  expect(testingNode.Tax()).toEqual(7);
  expect(testingNode.Dbit()).toEqual(1);
});

test('setter', () => {
  const testingNode = new NodeVal();
  testingNode.SetBalance(15);
  testingNode.SetTax(7);
  testingNode.SetDbit(1);
  expect(testingNode.Balance()).toEqual(15);
  expect(testingNode.Tax()).toEqual(7);
  expect(testingNode.Dbit()).toEqual(1);
  testingNode.SetValue(2, 1, [0, 0]);
  expect(testingNode.Balance()).toEqual(2);
  expect(testingNode.Tax()).toEqual(1);
  expect(testingNode.Dbit()).toEqual([0, 0]);
  expect(testingNode.Value()).toEqual([
    2, 1, [0, 0],
  ]);
});
