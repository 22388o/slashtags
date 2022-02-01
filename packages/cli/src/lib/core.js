import Corestore from 'corestore';
import RAM from 'random-access-memory';
import Hyperswarm from 'hyperswarm';
import Hypercore from 'hypercore';
import Hyperbee from 'hyperbee';
import { homedir } from 'os';
import b4a from 'b4a';

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

export class Slashtags {
  constructor(opts = {}) {
    let { storage, corestore, persist, swarmOpts, corestoreOpts } = opts;

    if (!storage && !corestore) {
      if (persist !== false) {
        storage = homedir() + '/.slash';
      } else {
        storage = RAM;
      }
    }

    this.store = new Corestore(storage, {
      ...DEFAULT_CORESTORE_OPTS,
      ...corestoreOpts,
    });

    this.swarm = new Hyperswarm({
      ...DEFAULT_SWARM_OPTS,
      ...swarmOpts,
    });

    const subStorage = (dir) => (p) => this.store.storage(dir + '/' + p);

    this.swarm.on('connection', (socket, info) => {
      this.store.replicate(socket);
    });

    this.db = new Hyperbee(new Hypercore(subStorage('db')), {
      keyEncoding: 'utf8',
      valueEncoding: 'json',
    });
  }

  async ready() {
    await this.db.ready();
    await this.store.ready();
    return this;
  }

  async close() {
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
