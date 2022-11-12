const elliptic = require('elliptic');
const ecdsa = new elliptic.ec('secp256k1');

test('should first', () => {
  let signature = ecdsa.sign('0x4e5632ac9ad741af0a82a86c02218d0a64dd9ed56eb4512fa11d975523203af9', '2a5425b6f3e36a88ee05bea41e44f54c80ae31eb63d229c34bcc83d0b524a701', 'hex', { canonical: true });
  console.log(signature.recoveryParam, signature.r.toString(16), signature.s.toString(16));
  
  signature = ecdsa.sign('0x3cdc7c72567a0a8a0f4f39a2d517446524ff0e3e0745ab21e14068dad94422dd', 'ffbb2849f0936024b22ff3459afcc052cba900d08be70af04f5ef0be2639101a', 'hex', { canonical: true });
  console.log(signature.recoveryParam, signature.r.toString(16), signature.s.toString(16));
  
  signature = ecdsa.sign('0x35c5270d5d4c1d08d925348fe232cde5c3490e86468ab7a5691078de52f28850', 'b8cd965482d2c15b8c383a589267498be98c2880618ec168424efd4337fc9aee', 'hex', { canonical: true });
  console.log(signature.recoveryParam, signature.r.toString(16), signature.s.toString(16));
  
  signature = ecdsa.sign('0xb02e2ac7a44ba56ef8900751ec3d74a3403ff565ae6cf6ccca8827f26664b07f', 'c9d47c758d5702babfd501389c485a4acb369b7d2f0750d25e74241fdf52bdfa', 'hex', { canonical: true });
  console.log(signature.recoveryParam, signature.r.toString(16), signature.s.toString(16));
    
 })