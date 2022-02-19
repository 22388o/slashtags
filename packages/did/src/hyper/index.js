import Corestore from 'corestore';
import RAM from 'random-access-memory';
import Hyperswarm from 'hyperswarm';
import { DHT } from 'dht-universal';
import Hypercore from 'hypercore';
import Hyperbee from 'hyperbee';
import b4a from 'b4a';

import { storage } from './storage.js';

const DEFAULT_CORESTORE_OPTS = {
  sparse: true,
};

const DEFAULT_SWARM_OPTS = {
  extensions: [],
};

const DEFAULT_CORE_OPTS = {
  sparse: true,
  persist: true,
  keyEncoding: 'utf8',
  valueEncoding: 'json',
};

export class HyperSDK {
  constructor(opts = {}) {
    this._opts = opts;

    if (!opts?.storage && !opts?.corestore) {
      if (opts?.persist !== false) {
        this.storage = storage();
      } else {
        this.storage = RAM;
      }
    }
    this.store =
      opts?.corestore ||
      new Corestore(this.storage || opts?.storage, {
        ...DEFAULT_CORESTORE_OPTS,
        ...(opts?.corestoreOpts || {}),
      });
    this.db = new Hyperbee(new Hypercore(this.subStorage('db')), {
      keyEncoding: 'utf8',
      valueEncoding: 'json',
    });
  }

  async init() {
    if (this._initalized) return this;

    this.dht = await DHT.create({ relays: ['wss://dht-relay.synonym.to'] });

    console.log(this.db);
    this.swarm = new Hyperswarm({
      ...DEFAULT_SWARM_OPTS,
      ...this._opts.swarmOpts,
      dht: this.dht,
    });

    this.swarm.on('connection', (socket, info) => {
      this.store.replicate(socket);
    });

    await this.db.ready();
    await this.store.ready();

    this._initalized = true;
    return this;
  }

  subStorage(dir) {
    return (p) => this.store.storage(dir + '/' + p);
  }

  async close() {
    await this.init();
    await this.swarm.destroy();
    await this.store.close();
  }

  async createCore(opts) {
    const core = this.store.get({
      ...DEFAULT_CORE_OPTS,
      ...opts,
    });
    await core.ready();

    const { announce = true, lookup = true } = opts;
    if (!announce && !lookup) return core;

    // Avoid unnecessary discovery that needs to be flushed
    if (this.swarm._discovery.has(b4a.toString(core.discoveryKey), 'hex'))
      return;

    this.swarm.join(core.discoveryKey, {
      server: announce,
      client: lookup,
    });

    return core;
  }

  async getCoreTail(opts) {
    const core = await this.createCore(opts);

    // TODO test core.update again to avoid this hack
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (core.length > 0) {
          clearInterval(interval);
          resolve(null);
        }
      }, 1);
      setTimeout(() => {
        clearInterval(interval);
        resolve(null);
      }, 2500);
    });

    const tail = core.length > 0 ? await core.get(core.length - 1) : null;

    return { tail, core };
  }
}
