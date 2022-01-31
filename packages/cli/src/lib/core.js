import Corestore from 'corestore';
import RAM from 'random-access-memory';
import Hyperswarm from 'hyperswarm';
import Networker from './networker.js';

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

const PROTECTED_NAMES = ['DID_STORE'];

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

    this.networker = new Networker(this.store, {
      ...DEFAULT_SWARM_OPTS,
      ...swarmOpts,
    });

    this.dids = new Map();
  }

  async ready() {
    await this.store.ready();
    return this;
  }

  async close() {
    await this.store.close();
    await this.networker.close();
  }

  async createCore(opts) {
    if (PROTECTED_NAMES.includes(opts.name)) throw new Error('Protected name');

    const core = this.store.get({
      ...DEFAULT_CORE_OPTS,
      ...opts,
    });
    await core.ready();

    const { announce = true, lookup = true } = opts;
    if (!announce && !lookup) return core;

    this.networker.configure(core.discoveryKey, { announce, lookup });

    core.once('close', () => {
      this.networker.configure(core.discoveryKey, {
        announce: false,
        lookup: false,
      });
    });

    return core;
  }

  async getCoreTail(opts) {
    const core = await this.createCore(opts);

    // TODO test core.update again to avoid this hack
    await core.get(0, { timeout: 0 });

    const tail = core.length > 0 ? await core.get(core.length - 1) : null;

    return { tail, core };
  }
}
