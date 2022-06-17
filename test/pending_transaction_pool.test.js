const Txn_Pool = require('../src/pending_transaction_pool');


test('test create', () => {
	var txpool = new Txn_Pool();
	txpool.create(1);
	expect(txpool.get_num_of_transaction()).toBe(43);
});

test('test clean', () => {
	var txpool = new Txn_Pool();
	txpool.create(1);
	txpool.create(2);
	txpool.clean();
	expect(txpool.get_num_of_transaction()).toBe(0);
});