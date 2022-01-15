import { RPC } from './rpc.js';
import { DHT } from 'dht-universal';
import b4a from 'b4a';

// Close websockets if they are not used for 2 minutes
// const TIMEOUT = 2 * 60 * 1000

/** @implements {SlashAPI} */
class Slash {
  constructor(opts) {
    this._dht = new DHT(opts);
    this._server = null;
    this._rpc = new RPC();
    this._connections = new Map();
  }

  async ready() {
    await this._dht.ready();
  }

  get address() {
    return b4a.from(this._dht.defaultKeyPair.publicKey);
  }

  async listen() {
    if (this._server) return this.address;

    this._server = this._dht.createServer((secretstream) =>
      secretstream.on('data', (data) =>
        this._rpc.handleRaw(data, secretstream),
      ),
    );

    await this._server.listen(this._dht.defaultKeyPair);

    return this.address;
  }

  addMethods(methods) {
    this._rpc.addMethods(methods);
  }

  /**
   *
   * @param {Uint8Array} address
   */
  async _setupNoiseSocket(address) {
    const noiseSocket = this._dht.connect(address);
    const key = b4a.toString(address, 'hex');
    // const createTimeout = () =>
    //   setTimeout(() => {
    //     noiseSocket.destroy();
    //     this._connections.delete(key);
    //   }, TIMEOUT);

    // let timeout = createTimeout();

    // const resetTimeout = () => {
    //   clearTimeout(timeout);
    //   timeout = createTimeout();
    // };

    const connection = {
      noiseSocket,
      //  resetTimeout, timeout
    };
    this._connections.set(key, connection);

    noiseSocket.on('data', (data) => {
      // resetTimeout();
      this._rpc.handleResponse(data);
    });
    noiseSocket.on('close', () => {
      this._connections.delete(key);
    });

    return new Promise((resolve, reject) => {
      noiseSocket.on('open', () =>
        resolve({
          noiseSocket,
          // resetTimeout
        }),
      );
      noiseSocket.on('error', (error) => {
        reject(error);
      });
    });
  }

  async request(address, method, params) {
    let openSocket = this._connections.get(b4a.toString(address, 'hex'));

    if (!openSocket || openSocket.noiseSocket.destroyed) {
      openSocket = await this._setupNoiseSocket(address);
    }

    return this._rpc.call(
      method,
      params,
      // @ts-ignore Error is thrown if openSocket is undefined
      openSocket.noiseSocket,
    );
  }

  async destroy() {
    await this._dht.destroy();
  }
}

const DEFAULT_RELAYS = ['wss://dht-relay.synonym.to'];

/**
 * Create a new instance of Slashtags node.
 *
 * @param {SlashAPI & {relays: string[]}} [opts]
 * @returns {Promise<SlashAPI>}
 */
export const Core = async (opts) => {
  const relays = opts?.relays || DEFAULT_RELAYS;

  for (const relay of relays) {
    try {
      const slash = new Slash({ ...opts, relay });
      await slash.ready();

      return slash;
    } catch (error) {}
  }
};

/**
 * @typedef {import ('./interfaces').SlashAPI} SlashAPI
 * @typedef {import ('./interfaces').SlashOpts} SlashOpts
 * @typedef {import ('./interfaces').RPCRequest} RPCRequest
 */
