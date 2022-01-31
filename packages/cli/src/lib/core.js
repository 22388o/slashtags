import Corestore from 'corestore';
import RAM from 'random-access-memory';
import Hyperswarm from 'hyperswarm';
import Hypercore from 'hypercore';
import Hyperbee from 'hyperbee';
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
        storage = 'slash/store';
      } else {
        storage = RAM;
      }
    }

    this.store = new Corestore(storage, {
      ...DEFAULT_CORESTORE_OPTS,
      ...corestoreOpts,
    });

    this.storage = this.store.storage;

    this.swarm = new Hyperswarm({
      ...DEFAULT_SWARM_OPTS,
      ...swarmOpts,
    });

    this.swarm.on('connection', (socket, info) => {
      this.store.replicate(socket);
    });

    const dbCore = new Hypercore((p) => this.storage('library/' + p));
    this.db = new Hyperbee(dbCore, {
      keyEncoding: 'utf8',
      valueEncoding: 'json',
    });

    this.coresCollection = this.db.sub('cores');
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

    this.addCore(core);

    const { announce = true, lookup = true } = opts;
    if (!announce && !lookup) return core;

    this.swarm.join(core.discoveryKey, {
      server: announce,
      client: lookup,
    });

    return core;
  }

  async addCore(core) {
    await this.coresCollection.ready();
    const id = b4a.toString(core.key, 'hex');
    if (await this.coresCollection.get(id)) return;
    this.coresCollection.put(id);
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
