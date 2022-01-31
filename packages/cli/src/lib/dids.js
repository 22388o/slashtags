import { prepend } from './utils.js';
import { base32 } from 'multiformats/bases/base32';
import Hyperbee from 'hyperbee';
import Hypercore from 'hypercore';
import b4a from 'b4a';

const URL_PREFIX = 'did:slash:';
const RepresentationMethods = {
  JSON_LD: 'application/did+ld+json',
  JSON: 'application/did+json',
};

export class SlashDID {
  constructor(opts) {}

  async update(value) {
    return this.core.append(value);
  }

  resolve() {
    return SlashDID.resolve(this.node, this.uri);
  }

  /**
   * Convert a public key to a DID
   * @param {{publicKey: Uint8Array }}
   * @param {'ES256K' | 'EdDSA'} [type = 'ES256K']
   * @returns {string}
   */
  static format(publicKey, type) {
    const codec = type === 'ES256K' ? 0xe7 : 0xed;
    return URL_PREFIX + base32.encode(prepend(codec, publicKey));
  }

  /**
   * Get the public key of the Hypercore from the did uri
   * @param {string} didURI
   */
  static coreKey(didURI) {
    const id = didURI.split(':').pop();
    const multiHash = base32.decode(id);
    const codec = multiHash.slice(1)[0];
    const key = b4a.from(multiHash.slice(2));
    return { key, type: codec === 0xe7 ? 'ES256K' : 'EdDSA' };
  }

  static getResolver(node) {
    return {
      slash: (did, parsed, didResolver, options) =>
        SlashDID.resolve(node, did, parsed, didResolver, options),
    };
  }

  /**
   * @returns {Promise<DIDResolutionResult>}
   */
  static async resolve(node, did, parsed, didResolver, options) {
    const contentType = options?.accept || RepresentationMethods.JSON_LD;
    const response = {
      didResolutionMetadata: { contentType },
      didDocument: null,
      didDocumentMetadata: {},
    };

    try {
      const { key, type } = SlashDID.coreKey(did);

      if (type !== 'EdDSA') {
        // TODO support custom crypto
      }

      const { tail, core } = await node.getCoreTail({ key });

      const doc = SlashDID.wrapDocument(tail, did);

      response.didDocumentMetadata = {
        // TODO support timestamps
        // created: head.created,
        // updated: head.updated,
        deactivated: tail?.deactivated || false,
        published: core.length > 0,
        versionId: core.length > 0 ? core.length : null,
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
   * Wraps the content resolved from corresponding Hypercore and formats it
   * as a proper DIDDocument.
   * If the content is null, it will generate a DIDDocument from the did uri.
   *
   * @param content - the content from the Hypercore
   * @param did - the did uri to use when wrapping the document
   */
  static wrapDocument(content, did) {
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
}

export class DIDStore {
  constructor(opts) {
    this.node = opts.node;
    this.dids = new Map();

    const core = new Hypercore((p) => this.node.storage('dids/' + p));
    this.bee = new Hyperbee(core, {
      keyEncoding: 'utf8',
      valueEncoding: 'json',
    });
  }

  async ready() {
    await this.bee.ready();
    await this.loadDIDs();
    return this;
  }

  async ls() {
    const stream = this.bee.createReadStream();
    const entries = [];

    stream.on('data', (data) => entries.push(data));

    return new Promise((resolve) => {
      stream.on('end', function () {
        resolve(entries);
      });
    });
  }

  async loadDIDs() {
    const aliases = await this.ls();

    this.dids = new Map(
      aliases.map((entry) => [
        entry.key,
        { uri: entry.value.uri, coreKey: b4a.from(entry.value.coreKey, 'hex') },
      ]),
    );
  }

  setDid({ alias, uri, coreKey }) {
    this.dids.set(alias, { uri, coreKey });
    return this.bee.put(alias, { uri, coreKey: b4a.toString(coreKey, 'hex') });
  }

  async createDID(alias) {
    if (this.dids.has(alias)) return this.dids.get(alias);

    const core = await this.node.createCore({ name: alias });
    await core.append({});

    const did = { alias, uri: SlashDID.format(core.key), coreKey: core.key };
    await this.setDid(did);

    setInterval(() => {
      core.append({ services: { foo: 'bar' } });
    }, 1000);

    return did;
  }

  // async addService(alias, service) {
  //
  // }
}

/**
 * @typedef {import('did-resolver').DIDDocument} DIDDocument
 * @typedef {import('did-resolver').ServiceEndpoint} ServiceEndpoint
 * @typedef {import('./interfaces').SlashDIDPublicKey} SlashDIDPublicKey
 * @typedef {import('./interfaces').SlashDIDContent} SlashDIDContent
 * @typedef {import('did-resolver').DIDResolutionResult} DIDResolutionResult
 */
