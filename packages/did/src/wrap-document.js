/**
 * Wraps the content resolved from corresponding Hypercore and formats it
 * as a proper DIDDocument.
 * If the content is null, it will generate a DIDDocument from the did uri.
 *
 * @param {SlashDIDContent} content - the content from the Hypercore
 * @param {string} did - the did uri to use when wrapping the document
 * @param {object} [opts]
 * @param {string} [opts.contentType = 'application/did+ld+json'] - the content type to use when wrapping the document
 */
export function wrapDocument(content, did, opts) {
  /** @type {DIDDocument} */
  const startDoc = {
    id: did,
    verificationMethod: [],
    authentication: [],
    assertionMethod: [],
    service: content?.s,
  };

  if (!opts?.contentType || opts?.contentType === 'application/did+ld+json')
    addContext(startDoc);

  /** @type {SlashDIDPublicKey[]} */
  const publicKeys = content?.p || defaultVerificationMethods(did);

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
 *
 * @param {DIDDocument} doc
 */
function addContext(doc) {
  doc['@context'] = [
    'https://w3id.org/did/v1',
    // @ts-ignore
    { '@base': doc.id },
  ];
}

/**
 *
 * @param {string} did
 * @returns {SlashDIDPublicKey[]}
 */
function defaultVerificationMethods(did) {
  const suffix = did.split(':').pop();
  if (!suffix) throw new Error('Invalid DID URI');

  return [
    {
      id: '#core-key',
      type: 'EcdsaSecp256k1VerificationKey2019',
      publicKeyMultibase: suffix,
      purposes: ['authentication', 'assertionMethod'],
    },
  ];
}

/**
 * @typedef {import('did-resolver').DIDDocument} DIDDocument
 * @typedef {import('did-resolver').ServiceEndpoint} ServiceEndpoint
 * @typedef {import('did-resolver').DIDResolutionResult} DIDResolutionResult
 * @typedef {import('did-resolver').DIDResolutionOptions} DIDResolutionOptions
 * @typedef {import('./interfaces').SlashDIDPublicKey} SlashDIDPublicKey
 * @typedef {import('./interfaces').SlashDIDContent} SlashDIDContent
 */
