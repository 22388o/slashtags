import { prepend } from './utils.js';
import { base32 } from 'multiformats/bases/base32';
import Hypercore from 'hypercore';
import ram from 'random-access-memory';
import b4a from 'b4a';

const URL_PREFIX = 'did:slash:';
const RepresentationMethods = {
  JSON_LD: 'application/did+ld+json',
  JSON: 'application/did+json',
};

const DID_DISCOVERY_CORE_KEY = b4a.from(
  'b1833a658413e155a4682808ca104086f969d7d28b36b0073d1dd509ba926446',
  'hex',
);

export class DIDStore {
  constructor(opts) {
    this.node = opts.node;
  }

  async init() {
    await this.node.ready();
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
      services: Array.from(
        new Map(
          [...tail.services, service].map((service) => [service.id, service]),
        ).values(),
      ),
    };

    return await core.append(newState);
  }

  async seedLocalDIDs() {
    for (const [_, didUri] of (await this.ls()).values()) {
      await this.node.createCore({ key: parseDidUri(didUri).key });
    }
  }

  async updateKnownDids(didUri, found) {
    if (!found) {
      this.knownDids.del(didUri);
    } else {
      this.knownDids.get(didUri).then((saved) => {
        if (!saved) this.knownDids.put(didUri);
      });
    }
  }

  async resolve(didUri) {
    const result = await resolve(this.node, didUri);

    this.updateKnownDids(didUri, result.didDocumentMetadata.versionId);

    return result;
  }

  async setupDiscoveryCore() {
    // if (this.watching) return;

    // this.discoveryCore = new Hypercore(ram, DID_DISCOVERY_CORE_KEY);
    // await this.discoveryCore.ready();

    // await this.node.swarm.join(this.discoveryCore.discoveryKey);
    // this.watching = true;

    // this.ext = this.discoveryCore.registerExtension('slash-did-discovery', {
    //   encoding: 'json',
    //   onmessage: (message, peer) => this.onmessage(message, peer),
    //   // onerror: (e) => this.emit('error', e),
    // });

    // this.discoveryCore.on('peer-open', (peer) => this.onpeer(peer));

    async function onmessage(message, peer) {}

    async function onpeer(peer) {}
  }
}

export function getResolver(node) {
  return {
    slash: (did, parsed, didResolver, options) =>
      resolve(node, did, parsed, didResolver, options),
  };
}

/**
 * Wraps the content resolved from corresponding Hypercore and formats it
 * as a proper DIDDocument.
 * If the content is null, it will generate a DIDDocument from the did uri.
 *
 * @param content - the content from the Hypercore
 * @param did - the did uri to use when wrapping the document
 */
function wrapDocument(content, did) {
  /** @type {DIDDocument} */
  const startDoc = {
    id: did,
    verificationMethod: [],
    authentication: [],
    assertionMethod: [],
    service: content?.services,
  };

  /** @type {SlashDIDPublicKey[]} */
  const publicKeys = content?.publicKeys || [
    {
      id: '#core-key',
      type: 'EcdsaSecp256k1VerificationKey2019',
      publicKeyMultibase: did.split(':').pop(),
      purposes: ['authentication', 'assertionMethod'],
    },
  ];

  return publicKeys.reduce((doc, key) => {
    /** @type {import ('did-resolver').VerificationMethod} */
    const entry = {
      id: key.id,
      type: key.type,
      controller: did,
    };

    doc.verificationMethod.push(entry);

    key.purposes.forEach((purpose) => {
      switch (purpose) {
        case 'authentication':
          doc.authentication.push(key.id);
          break;
        case 'assertionMethod':
          doc.assertionMethod.push(key.id);
        // TODO consider other publicKey purposes
        // break;
        // case 'capabilityInvocation':
        // doc.capabilityInvocation.push(key.id);
        // break;
        // case 'capabilityDelegation':
        // doc.capabilityDelegation.push(key.id);
        // break;
        // case 'keyAgreement':
        // TODO handle different key agreement types
        // doc.keyAgreement.push(key.id);
        // break;

        default:
      }
    });

    return doc;
  }, startDoc);
}

/**
 * @returns {Promise<DIDResolutionResult>}
 */
async function resolve(node, did, parsed, didResolver, options) {
  const contentType = options?.accept || RepresentationMethods.JSON_LD;
  const response = {
    didResolutionMetadata: { contentType },
    didDocument: null,
    didDocumentMetadata: {},
  };

  try {
    const { key, type } = parseDidUri(did);

    if (type !== 'EdDSA') {
      // TODO support custom crypto
    }

    const { tail, core } = await node.getCoreTail({ key });

    const doc = wrapDocument(tail, did);

    response.didDocumentMetadata = {
      // TODO support timestamps
      // created: head.created,
      // updated: head.updated,
      deactivated: tail?.deactivated || false,
      merkleTree: core.length > 0 && {
        length: core.length,
        fork: core.core.tree.fork,
        treeHash: b4a.toString(core.core.tree.hash(), 'hex'),
      },
      versionId: core.length > 0 && b4a.toString(core.core.tree.hash(), 'hex'),
      // TODO support core forks in Hypercore 10
      // fork: core.fork,
    };

    if (contentType === RepresentationMethods.JSON_LD) {
      response.didDocument = {
        '@context': 'https://w3id.org/did/v1',
        ...doc,
      };
    } else if (contentType === RepresentationMethods.JSON) {
      response.didDocument = doc;
    } else {
      delete response.didResolutionMetadata.contentType;
      response.didResolutionMetadata.error = 'representationNotSupported';
    }
  } catch (e) {
    response.didResolutionMetadata.error = 'invalidDid';
    response.didResolutionMetadata.message = e.toString();
  }

  return response;
}

/**
 * Convert a public key to a DID
 * @param {{publicKey: Uint8Array }}
 * @param {'ES256K' | 'EdDSA'} [type = 'ES256K']
 * @returns {string}
 */
function formatDidUri(publicKey, type) {
  const codec = type === 'ES256K' ? 0xe7 : 0xed;
  return URL_PREFIX + base32.encode(prepend(codec, publicKey));
}

/**
 * Get the public key of the Hypercore from the did uri
 * @param {string} didURI
 */
function parseDidUri(didURI) {
  const id = didURI.split(':').pop();
  const multiHash = base32.decode(id);
  const codec = multiHash.slice(1)[0];
  const key = b4a.from(multiHash.slice(2));
  return { key, type: codec === 0xe7 ? 'ES256K' : 'EdDSA' };
}

/**
 * @typedef {import('did-resolver').DIDDocument} DIDDocument
 * @typedef {import('did-resolver').ServiceEndpoint} ServiceEndpoint
 * @typedef {import('./interfaces').SlashDIDPublicKey} SlashDIDPublicKey
 * @typedef {import('./interfaces').SlashDIDContent} SlashDIDContent
 * @typedef {import('did-resolver').DIDResolutionResult} DIDResolutionResult
 */
