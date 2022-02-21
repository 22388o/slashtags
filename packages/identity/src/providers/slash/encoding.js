// @ts-ignore
import c from 'compact-encoding'
// @ts-ignore
import { maybeEnum } from 'compact-encoding-maybe-enum'
// @ts-ignore
import { compile, opt, flag } from 'compact-encoding-struct'

/** @type {string[]} */
const ServiceTypes = [
  // Add commonly used Service Types here
]

const Service = compile({
  id: c.string,
  type: maybeEnum(ServiceTypes),
  serviceEndpoint: c.string
})

const KeyTypes = ['ED25519', 'SECP256K1']

const Key = compile({
  id: c.string,
  type: maybeEnum(KeyTypes),
  key: c.string,
  authentication: flag,
  assertionMethod: flag,
  keyAgreement: flag,
  capabilityInvocation: flag,
  capabilityDelegation: flag
})

const BlockStruct = {
  services: opt(c.array(Service)),
  keys: opt(c.array(Key))
}

export const SlashDIDEncoding = compile(BlockStruct)
