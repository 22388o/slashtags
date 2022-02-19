import { expect } from 'aegir/utils/chai.js';
import { Resolver } from 'did-resolver';
import { getResolver, resolve } from '../src/resolver.js';
import { HyperSDK } from '../src/hyper/index.js';
// import slashtags from '@synonymdev/slashtags-core';
import { createAgent } from '@veramo/core';
import { DHT } from 'dht-universal';
import Corestore from 'corestore';
import ram from 'random-access-memory';
import b4a from 'b4a';
import Hyperswarm from 'hyperswarm';
import slashtags from '../src/slashtags.js';

describe('create', () => {
  it('should create a new did', async () => {
    const slash = createAgent({
      plugins: [await hypercore(), await didManager()],
    });

    const did = await slash.didManagerCreate({ alias: 'foo' });

    slash.emit('close');

    // console.log(did);

    const slas = slashtags();
    console.log(slas);
    console.log(slas.use);
    console.log(slas.emit);
  });
});

const DEFAULT_CORE_OPTS = {
  sparse: true,
  persist: true,
  keyEncoding: 'utf8',
  valueEncoding: 'json',
};

async function hypercore() {
  const dht = await DHT.create({ relays: ['ws://localhost:34307'] });
  const swarm = new Hyperswarm({ dht });

  const store = new Corestore(ram);
  await store.ready();

  return {
    eventTypes: ['close'],
    onEvent: async (event) => {
      if (event.type === 'close') {
        // dht.destroy();
        swarm.destroy();
      }
    },
    methods: {
      hypercoreCreate: async (args, context) => {
        const opts = args;

        const core = store.get({
          ...DEFAULT_CORE_OPTS,
          ...opts,
        });
        await core.ready();

        const { announce = true, lookup = true } = opts;
        if (!announce && !lookup) return core;

        // Avoid unnecessary discovery that needs to be flushed
        if (swarm._discovery.has(b4a.toString(core.discoveryKey, 'hex')))
          return;

        swarm.join(core.discoveryKey, {
          server: announce,
          client: lookup,
        });

        return core;
      },
    },
  };
}

async function didManager(options) {
  return {
    methods: {
      /** @param {{alias: string}} args */
      didManagerCreate: async (args, context) => {
        const core = context.agent.hypercoreCreate({ name: args.alias });

        return core;
      },
    },
  };
}
