const Wallet = require('../src/Utility/wallet.js');
const elliptic = require('elliptic');
const ecdsa = new elliptic.ec('secp256k1');

describe('wallet test', () => {

  const wallet1 = new Wallet();
  const wallet2 = new Wallet('d756e19af3303ea489eb5a8c5a44ac10a38317fc7ee85ec599bf158232601aa8', '04f586957689dd425776cb9dabf6c8fa5b311a175ede33e1e85b54c931b6d8fb14f8085a1b095e6886a25bbe346da08eb05e605f100e67272da7dac4d4c43d60bc')
  
  test('test wallet without predefined keys', () => {
    expect(wallet1.privateKey).toBeDefined();
    expect(wallet1.publicKey).toBeDefined();
  });

  test('test wallet with predefined keys', () => {
    expect(wallet2.privateKey).toBeDefined();
    expect(wallet2.publicKey).toBeDefined();
  });

  test('test wallet generate address', () => {
    const address3000 = wallet2.Address();
    expect(address3000).toMatch('0xeda0ec27FBA7FE0773FD15D47F19fd6be7E6b2f4');
    
  });

  test('test wallet sign', () => {
    const sig = wallet2.Sign('abc');
    const hexToDecimal = (x) => ecdsa.keyFromPrivate(x, 'hex').getPrivate().toString(10);
    const pubkey = ecdsa.recoverPubKey(hexToDecimal('abc'), sig, sig.recoveryParam, 'hex');

    expect(pubkey.encode('hex')).toMatch('f586957689dd425776cb9dabf6c8fa5b311a175ede33e1e85b54c931b6d8fb14f8085a1b095e6886a25bbe346da08eb05e605f100e67272da7dac4d4c43d60bc');
    
  });

  test('test wallet validate address', () => {

    expect(wallet2.ValidateAddress('76f72b060b2f0a702f5fada34d005578f3b0e8f8')).toBeTruthy();
    
  });

  test('wallet port map', () => {
    expect(wallet2.getAddress(3000)).toMatch('0x76f72b060b2f0a702f5fada34d005578f3b0e8f8');
  });

  test('wallet port map get pubkey', () => {
    expect(wallet2.getPubKey(3000)).toMatch('04f586957689dd425776cb9dabf6c8fa5b311a175ede33e1e85b54c931b6d8fb14f8085a1b095e6886a25bbe346da08eb05e605f100e67272da7dac4d4c43d60bc');
  });

});