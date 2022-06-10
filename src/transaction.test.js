const Txn_Pool = require('./pending_transaction_pool');
const Txn = require('./transaction')

test('test tx 1', () => {
    var txpool = new Txn_Pool();
    txpool.create(1);
    txs = txpool.get_transaction()
    expect(Number(txs[0].get_value(0))).toBe(0);
});