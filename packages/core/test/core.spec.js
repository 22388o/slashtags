import { expect } from 'aegir/utils/chai.js';
import { creatNode, clearNodes } from './helpers/node.js';

describe.only('RPC methods', () => {
  after(clearNodes);

  it('should throw an error for Nonexistent method', async () => {
    const node1 = await creatNode();
    const adress = await node1.listen();

    const node2 = await creatNode();

    try {
      await node2.request(adress, 'ping', { test: 1 });
    } catch (error) {
      expect(error).to.eql({
        error: {
          code: -32601,
          message: 'Method not found: ping',
        },
        id: 0,
        jsonrpc: '2.0',
      });
    }
  });

  it('should respond to a request for an existing method', async () => {
    const node1 = await creatNode();
    node1.addMethods({
      ping: async () => 'pong',
    });
    const address = await node1.listen();

    const node2 = await creatNode();
    const response = await node2.request(address, 'ping', {});
    console.log(response);

    expect(response.body).to.equal('pong');
  });

  it('Acting as server and client', async () => {
    const node1 = await creatNode();
    node1.addMethods({ ping: async () => 'pong' });
    const adress1 = await node1.listen();

    const node2 = await creatNode();
    node2.addMethods({ ping: async () => 'pong' });

    node1.addMethods({ ping: async () => 'pong' });
    const adress2 = await node2.listen();

    expect((await node2.request(adress1, 'ping', {})).body, 'pong');

    const node3 = await creatNode();
    expect((await node3.request(adress2, 'ping', {})).body, 'pong');
  });

  // it('Core: Should not connect to an already open socket', async () => {
  //   const node1 = await Core();
  //   node1.addMethods({ ping: async () => 'pong' });
  //   const adress1 = await node1.listen();

  //   const node2 = await Core({ requestTimout: 600 });

  //   await node2.request(adress1, 'ping', {});
  //   const openSocket = Array.from(node2._openSockets.values())[-1];

  //   await new Promise((resolve) => setTimeout(() => resolve(), 200));

  //   await node2.request(adress1, 'ping', {});
  //   t.deepEqual(openSocket, Array.from(node2._openSockets.values())[-1]);
  // });

  // it('should clean sockets after timeout', async () => {
  //   const node1 = await Core();
  //   node1.addMethods({ ping: async () => 'pong' });
  //   const adress1 = await node1.listen();

  //   const node2 = await Core({ requestTimout: 500 });
  //   await node2.request(adress1, 'ping', {});
  //   const openScoket = Array.from(node2._openSockets.values())[0];

  //   t.deepEqual(openScoket.noiseSocket.destroyed, false);
  //   await new Promise((resolve) => setTimeout(() => resolve(), 600));
  //   t.deepEqual(openScoket.noiseSocket.destroyed, true);
  //   t.deepEqual(Array.from(node2._openSockets.values()).length, 0);

  //   await node2.request(adress1, 'ping', {});
  // });

  // it('response should contain noiseSocket', async () => {
  //   const node1 = await Core();
  //   node1.addMethods({ ping: async () => 'pong' });
  //   const adress1 = await node1.listen();

  //   const node2 = await Core();

  //   t.deepEqual(
  //     (await node2.request(adress1, 'ping', {})).noiseSocket,
  //     Array.from(node2._openSockets.values())[0].noiseSocket,
  //   );
  // });

  // it('request should contain noiseSocket', async () => {
  //   const node1 = await Core();
  //   const adress1 = await node1.listen();

  //   const node2 = await Core();

  //   node1.addMethods({
  //     ping: async (request) => {
  //       t.deepEqual(
  //         request.noiseSocket.handshakeHash.toString(),
  //         Array.from(
  //           node2._openSockets.values(),
  //         )[0].noiseSocket.handshakeHash.toString(),
  //       );

  //       return 'pong';
  //     },
  //   });

  //   await node2.request(adress1, 'ping', {});
  // });

  // it('listening on an already listening server', async () => {
  //   const node1 = await RPC();
  //   const adress = await node1.listen();
  //   const adress2 = await node1.listen();

  //   t.deepEqual(adress, adress2);
  // });

  // it('throw an error if connection failed', async () => {
  //   const node = await RPC();

  //   try {
  //     await node.request(Buffer.from('123', 'hex'), 'ping', {});
  //   } catch (error) {
  //     t.deepEqual(error, new Error('Could not find peer'));
  //   }
  // });
});
