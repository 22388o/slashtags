// import { expect } from 'aegir/utils/chai.js';
// import { RPC } from '../src/rpc.js';
// import b4a from 'b4a';

// describe('RPC', () => {
//   it('should responds correctly to a valid call', async () => {
//     const rpc = new RPC();

//     rpc.addMethods({
//       ping: async (request) => {
//         return 'pong:' + request.noiseSocket.handshakeHash;
//       },
//     });

//     const response = await rpc.handle({
//       jsonrpc: '2.0',
//       id: 3423,
//       method: 'ping',
//       params: {},
//       noiseSocket: {
//         handshakeHash: 'test-handshakehash',
//       },
//     });

//     expect(response).to.equal(
//       '{"jsonrpc":"2.0","id":3423,"result":"pong:test-handshakehash"}',
//     );
//   });

//   it('should throws parsing error', async () => {
//     const rpc = new RPC();

//     rpc.addMethods({
//       ping: async (request) => {
//         return 'pong:' + request.noiseSocket.handshakeHash;
//       },
//     });

//     const response = await rpc.handle({ foo: 'bar' });

//     expect(response).to.equal(
//       '{"message":"Invalid request","code":-32600,"data":{"foo":"bar"}}',
//     );
//   });

//   it('should throws error on Method not found', async () => {
//     const rpc = new RPC();

//     const response = await rpc.handle({
//       jsonrpc: '2.0',
//       id: 3423,
//       method: 'ping',
//       params: { foo: 'bar' },
//       noiseSocket: null,
//     });

//     expect(response).to.equal(
//       '{"jsonrpc":"2.0","id":3423,"error":{"message":"Method not found: ping","code":-32601}}',
//     );
//   });

//   it('should pass thrown errors from methods', async () => {
//     const rpc = new RPC();

//     rpc.addMethods({
//       ping: async () => {
//         throw new Error('test error from method');
//       },
//     });

//     const response = await rpc.handle({
//       jsonrpc: '2.0',
//       id: 3423,
//       method: 'ping',
//       params: { foo: 'bar' },
//       noiseSocket: null,
//     });

//     expect(response).to.equal(
//       '{"jsonrpc":"2.0","id":3423,"error":{"message":"test error from method","code":-32000}}',
//     );
//   });

//   it('should pass thrown errors from methods, with no message', async () => {
//     const rpc = new RPC();

//     rpc.addMethods({
//       ping: async () => {
//         throw new Error();
//       },
//     });

//     const response = await rpc.handle({
//       jsonrpc: '2.0',
//       id: 3423,
//       method: 'ping',
//       params: { foo: 'bar' },
//       noiseSocket: null,
//     });

//     expect(response).to.equal(
//       '{"jsonrpc":"2.0","id":3423,"error":{"message":"Error","code":-32000}}',
//     );
//   });

//   it('should handle raw Uint8Array data', async () => {
//     const rpc = new RPC();
//     rpc.addMethods({ 'ping:': () => 'pong' });

//     const request = JSON.stringify({
//       method: 'ping:',
//       params: {},
//       id: 1,
//       jsonrpc: '2.0',
//     });

//     const uintRequest = b4a.from(request);

//     const response = '{"jsonrpc":"2.0","id":1,"result":"pong"}';

//     rpc.handleRaw(uintRequest, {
//       write: (data) => expect(data).to.equal(response),
//     });

//     rpc.handleRaw(request, {
//       write: (data) => expect(data).to.equal(response),
//     });
//   });
// });
