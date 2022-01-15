// import { expect } from 'aegir/utils/chai.js';
// import b4a from 'b4a';
// import { Core } from '../src/index.js';

// const VALID_RELAY_SERVER = 'wss://dht-relay.synonym.to/';
// const INVALID_RELAY_SERVER = 'ws://invalid.something.net';

// const DHT_KEY = b4a.from(
//   '3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29',
//   'hex',
// );

// describe('DHT', () => {
//   it('should connect to a running node', async () => {
//     const node = await Core();
//     const secretStream = node.connect(DHT_KEY);

//     expect(secretStream.remotePublicKey).to.equal(DHT_KEY);
//     node.destroy();
//   });

//   it('should create DHT node and accept a connection from another', async () => {
//     const node1 = await Core();
//     const node2 = await Core();
//     const secretStream = node2.connect(node1.defaultKeyPair.publicKey);

//     expect(secretStream.remotePublicKey).to.equal(
//       node1.defaultKeyPair.publicKey,
//     );
//     expect(node1.defaultKeyPair.publicKey).to.not.equal(
//       node2.defaultKeyPair.publicKey,
//     );

//     node1.destroy();
//     node2.destroy();
//   });

//   it('should try relay servers until one is working', async () => {
//     const node = await Core({
//       relays: [INVALID_RELAY_SERVER, VALID_RELAY_SERVER],
//     });
//     const secretStream = node.connect(DHT_KEY);

//     expect(secretStream.remotePublicKey).to.equal(DHT_KEY);
//     node.destroy();
//   });

//   it('should throw an error if no relays worked', async () => {
//     try {
//       const node = await Core({ relays: [INVALID_RELAY_SERVER] });
//       node.destroy();
//     } catch (error) {
//       expect(error.message).to.equal(
//         'Could not connect to any of the DHT relays',
//       );
//     }
//   });
// });
