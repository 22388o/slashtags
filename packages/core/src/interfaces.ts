import type { JSONElement } from '@synonymdev/slashtags-common'
import type { DHTOpts, SecretStream } from 'dht-universal/types/src/interfaces'

export type RpcParams = Record<string, JSONElement>

export interface RPCRequest {
  id: number
  method: string
  params: RpcParams
  jsonrpc: '2.0'
  noiseSocket: SecretStream
}

export interface RPCMethod {
  (req: RPCRequest): Promise<JSONElement> | JSONElement
}

export interface SlashOpts extends DHTOpts {}

export declare class SlashAPI {
  constructor (opts?: SlashOpts);

  readonly address: Uint8Array

  addMethods: (methods: Record<string, RPCMethod>) => void
  listen: () => Promise<Uint8Array>
  request: (
    address: Uint8Array,
    method: string,
    params: RpcParams,
  ) => Promise<{ body: JSONElement, noiseSocket: SecretStream }>

  destroy: () => Promise<void>
}
