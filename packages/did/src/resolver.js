import { wrapDocument } from './wrap-document.js';
import { parseDidUri } from './url-utils.js';
import b4a from 'b4a';
import { DIDBlock } from './encoding.js';

const AcceptedRepresentationMethods = [
  'application/did+ld+json',
  'application/did+json',
];

export function getResolver(sdk) {
  return {
    slash: (did, parsed, didResolver, options) =>
      resolve(sdk, did, parsed, didResolver, options),
  };
}

/**
 * @param {*} sdk
 * @param {string} did
 * @param {*} parsed
 * @param {*} didResolver
 * @param {DIDResolutionOptions} options
 * @returns {Promise<DIDResolutionResult>}
 */
export async function resolve(sdk, did, parsed, didResolver, options) {
  const contentType = options?.accept || 'application/did+ld+json';

  /** @type {DIDResolutionResult} */
  const response = {
    didResolutionMetadata: { contentType },
    didDocument: { id: did },
    didDocumentMetadata: {},
  };

  try {
    const { key, type } = parseDidUri(did);

    if (type !== 'EdDSA') {
      // TODO support custom crypto
    }

    await sdk.ready();
    const { tail, core } = await sdk.getCoreTail({
      key,
      valueEncoding: DIDBlock,
    });

    response.didDocument = wrapDocument(tail, did, {
      contentType: options?.accept,
    });

    response.didDocumentMetadata = wrapDocumentMetadata(core);

    if (!AcceptedRepresentationMethods.includes(contentType)) {
      delete response.didResolutionMetadata.contentType;
      response.didResolutionMetadata.error = 'representationNotSupported';
    }
  } catch (/** @type {any} */ e) {
    response.didResolutionMetadata.error = 'invalidDid';
    response.didResolutionMetadata.message = e.toString();
  }

  return response;
}

function wrapDocumentMetadata(core) {
  if (!core) return {};

  const {
    length,
    core: { tree },
  } = core;
  const fork = tree.fork;
  const treeHash = b4a.toString(tree.hash(length), 'hex');
  // TODO: Resolve at an earlier sequence
  const seq = length - 1;

  return {
    // TODO support timestamps
    // created: head.created,
    // updated: head.updated,
    // support deactivated?
    merkleTree: { length, fork, treeHash },
    versionId: fork + '-' + seq + '-' + treeHash,
  };
}

/**
 * @typedef {import('did-resolver').DIDDocument} DIDDocument
 * @typedef {import('did-resolver').ServiceEndpoint} ServiceEndpoint
 * @typedef {import('did-resolver').DIDResolutionResult} DIDResolutionResult
 * @typedef {import('did-resolver').DIDResolutionOptions} DIDResolutionOptions
 */
