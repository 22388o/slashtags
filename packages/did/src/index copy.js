import b4a from 'b4a';

import { formatDidUri, parseDidUri } from './url-utils.js';
import { resolve } from './resolver.js';
import { HyperSDK } from './hyper/index.js';

const DID_DISCOVERY_CORE_KEY = b4a.from(
  'b1833a658413e155a4682808ca104086f969d7d28b36b0073d1dd509ba926446',
  'hex',
);

export class DIDManager {
  constructor(opts) {
    this.node = opts.node || new HyperSDK();
  }

  async init() {
    await this.node.ready();
    await this._setupBroadcast();
    this.aliasedDids = this.node.db.sub('aliased-dids');
    this.knownDids = this.node.db.sub('known-dids');
    return this;
  }

  async ls() {
    const stream = this.aliasedDids.createReadStream();
    /** @type {Array<[string, string]>} */
    const list = [];
    stream.on(
      'data',
      /** @param {{key:string, value: string}} data*/
      (data) => list.push([data.key, data.value]),
    );
    await new Promise((resolve) => stream.on('end', resolve));
    return list;
  }

  async createDID(alias) {
    const entry = await this.aliasedDids.get(alias);
    if (entry) return { alias, did: entry.value, created: false };

    const core = await this.node.createCore({ name: alias });
    await core.append({});

    const didUri = formatDidUri(core.key);

    await this.aliasedDids.put(alias, didUri);
    return { alias, did: didUri, created: true };
  }

  async addService(didUri, service) {
    const { core, tail } = await this.node.getCoreTail({
      key: parseDidUri(didUri).key,
    });

    const newState = {
      ...tail,
      s:
        tail.services?.length > 0
          ? Array.from(
              new Map(
                [...tail.services, service].map((service) => [
                  service.id,
                  service,
                ]),
              ).values(),
            )
          : [service],
    };

    return await core.append(newState);
  }

  async seedLocalDIDs() {
    for (const [_, didUri] of (await this.ls()).values()) {
      await this.node.createCore({ key: parseDidUri(didUri).key });
    }
  }

  async resolve(didUri) {
    const result = await resolve(this.node, didUri);

    this._updateKnownDids(didUri, result.didDocumentMetadata.versionId);

    return result;
  }

  async _updateKnownDids(didUri, found) {
    if (!found) {
      this.knownDids.del(didUri);
    } else {
      this.knownDids.get(didUri).then((saved) => {
        if (!saved) this.knownDids.put(didUri);
      });
    }
  }

  async _setupBroadcast() {
    // TODO - this should be a config option
    const broadcastCore = await this.node.createCore({
      key: DID_DISCOVERY_CORE_KEY,
      announce: true,
      lookup: true,
    });

    const broadcastExt = broadcastCore.registerExtension(
      'slash-did-discovery',
      {
        encoding: 'json',
        onmessage: (message, peer) => this.onmessage(message, peer),
        onerror: (e) => this.emit('error', e),
      },
    );

    // this.discoveryCore.on('peer-open', (peer) => this.onpeer(peer));

    async function onmessage(message, peer) {}

    async function onpeer(peer) {
      broadcastExt.broadcast();
    }
  }
}
